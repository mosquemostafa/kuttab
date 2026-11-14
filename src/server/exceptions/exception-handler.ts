import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ErrorCodes } from "@/server/constants/error-codes";
import { HttpException } from "@/server/exceptions/http.exception";
import type { ApiError } from "@/shared/types/api-response.types";

export function handleException(error: unknown): NextResponse<ApiError> {
  const timestamp = new Date().toISOString();

  if (error instanceof HttpException) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
        timestamp,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: "Validation failed",
          details: error.flatten().fieldErrors,
        },
        timestamp,
      },
      { status: 422 },
    );
  }

  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "APIError"
  ) {
    const apiError = error as { status?: number | string; message?: string };
    const statusCode =
      typeof apiError.status === "number"
        ? apiError.status
        : apiError.status === "FORBIDDEN"
          ? 403
          : apiError.status === "UNAUTHORIZED"
            ? 401
            : apiError.status === "TOO_MANY_REQUESTS"
              ? 429
              : 400;

    const code =
      statusCode === 401
        ? ErrorCodes.UNAUTHORIZED
        : statusCode === 403
          ? ErrorCodes.FORBIDDEN
          : statusCode === 429
            ? ErrorCodes.TOO_MANY_REQUESTS
            : ErrorCodes.VALIDATION_ERROR;

    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message: apiError.message || "Authentication error",
        },
        timestamp,
      },
      { status: statusCode },
    );
  }

  const dbError = extractDatabaseError(error);
  if (dbError?.code === "23505") {
    const message = resolveUniqueConstraintMessage(
      dbError.constraint,
      dbError.table,
    );
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.CONFLICT,
          message,
        },
        timestamp,
      },
      { status: 409 },
    );
  }

  if (dbError?.code === "23503") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: "The referenced item was not found.",
        },
        timestamp,
      },
      { status: 400 },
    );
  }

  if (dbError?.code === "23514") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: "Validation constraint failed. Please check your inputs.",
        },
        timestamp,
      },
      { status: 422 },
    );
  }

  console.error("[UnhandledException]", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
      },
      timestamp,
    },
    { status: 500 },
  );
}

function extractDatabaseError(error: unknown): {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
} | null {
  if (!error || typeof error !== "object") return null;

  const direct = error as Record<string, unknown>;
  const cause = direct.cause as Record<string, unknown> | undefined;

  const code =
    typeof direct.code === "string"
      ? direct.code
      : typeof cause?.code === "string"
        ? cause.code
        : undefined;

  const constraint =
    typeof direct.constraint === "string"
      ? direct.constraint
      : typeof cause?.constraint === "string"
        ? cause.constraint
        : undefined;

  const detail =
    typeof direct.detail === "string"
      ? direct.detail
      : typeof cause?.detail === "string"
        ? cause.detail
        : undefined;

  const table =
    typeof direct.table === "string"
      ? direct.table
      : typeof cause?.table === "string"
        ? cause.table
        : undefined;

  if (code || constraint || detail) {
    return { code, constraint, detail, table };
  }

  if (
    typeof direct.message === "string" &&
    direct.message.includes("duplicate key value violates unique constraint")
  ) {
    return { code: "23505", constraint, detail, table };
  }

  return null;
}

function resolveUniqueConstraintMessage(
  constraint?: string,
  table?: string,
): string {
  switch (constraint) {
    case "tags_user_id_name_unique":
      return "A tag with this name already exists.";
    case "videos_user_url_unique_idx":
      return "A video with this URL already exists in your library.";
    case "video_playlist_items_unique_idx":
      return "This video is already in this playlist.";
    case "segment_name_unique":
      return "A segment with this name already exists.";
    case "blog_slug_unique_idx":
      return "A blog with this slug already exists.";
    case "newsletter_campaigns_slug_unique":
      return "This newsletter slug is already in use.";
    case "newsletter_campaign_send_campaign_subscriber_unique":
      return "This subscriber has already been queued for this campaign.";
    case "user_storage_connections_user_provider_idx":
      return "A storage connection for this provider already exists.";
    case "users_announcement_user_announcement_unique":
      return "Announcement already marked as seen.";
    default:
      if (table === "segments")
        return "A segment with this name already exists.";
      if (table === "blogs") return "A blog with this slug already exists.";
      return "This item already exists.";
  }
}
