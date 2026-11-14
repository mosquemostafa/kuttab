import { z } from "zod";

import { ValidationException } from "@/server/exceptions/exceptions";
import { NOTIFICATION_TYPES } from "@/shared/constants/notification-types";

const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

const METADATA_MAX_KEYS = 5;
const METADATA_MAX_UTF8_BYTES = 2048;

function addMetadataIssues(
  metadata: Record<string, unknown>,
  ctx: z.RefinementCtx,
) {
  const keys = Object.keys(metadata);
  if (keys.length > METADATA_MAX_KEYS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Metadata must have at most ${METADATA_MAX_KEYS} keys`,
      path: ["metadata"],
    });
    return;
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(metadata);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Metadata must be JSON-serializable",
      path: ["metadata"],
    });
    return;
  }
  if (Buffer.byteLength(serialized, "utf8") > METADATA_MAX_UTF8_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Metadata must be at most ${METADATA_MAX_UTF8_BYTES} UTF-8 bytes when serialized`,
      path: ["metadata"],
    });
  }
}

export const notificationCreatePayloadSchema = z
  .object({
    type: notificationTypeSchema,
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(5000),
    link: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .nullable()
      .transform((s) => (s == null || s === "" ? null : s)),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.link != null && !val.link.startsWith("/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Link must be a path starting with /",
        path: ["link"],
      });
    }
    if (
      val.metadata != null &&
      typeof val.metadata === "object" &&
      !Array.isArray(val.metadata)
    ) {
      addMetadataIssues(val.metadata as Record<string, unknown>, ctx);
    }
  });

export type NotificationCreatePayload = z.infer<
  typeof notificationCreatePayloadSchema
>;

export const adminCreateNotificationSchema = z
  .object({ userId: z.string().min(1) })
  .and(notificationCreatePayloadSchema);

const listNotificationsQuerySchema = z.object({
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
  cursor: z.string().trim().min(1).optional(),
  limit: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? 20 : v),
    z.coerce.number().int().min(1).max(50),
  ),
});

type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export function parseListNotificationsQuery(
  searchParams: URLSearchParams,
): ListNotificationsQuery & { cursorDate?: Date } {
  const raw = {
    unreadOnly: searchParams.get("unreadOnly") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  };
  const parsed = listNotificationsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationException(parsed.error.flatten().fieldErrors);
  }
  const { cursor, ...rest } = parsed.data;
  if (cursor !== undefined && Number.isNaN(Date.parse(cursor))) {
    throw new ValidationException({ cursor: ["Invalid cursor"] });
  }
  return {
    ...rest,
    cursor,
    cursorDate: cursor !== undefined ? new Date(cursor) : undefined,
  };
}

export const notificationIdParamSchema = z.string().trim().min(1);

/** Cursor pagination for read-notification history (`GET /api/notifications/read`). */
const readNotificationsQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? 20 : v),
    z.coerce.number().int().min(1).max(50),
  ),
});

type ReadNotificationsQuery = z.infer<typeof readNotificationsQuerySchema>;

export function parseReadNotificationsQuery(
  searchParams: URLSearchParams,
): ReadNotificationsQuery & { cursorDate?: Date } {
  const raw = {
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  };
  const parsed = readNotificationsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationException(parsed.error.flatten().fieldErrors);
  }
  const { cursor, ...rest } = parsed.data;
  if (cursor !== undefined && Number.isNaN(Date.parse(cursor))) {
    throw new ValidationException({ cursor: ["Invalid cursor"] });
  }
  return {
    ...rest,
    cursor,
    cursorDate: cursor !== undefined ? new Date(cursor) : undefined,
  };
}
