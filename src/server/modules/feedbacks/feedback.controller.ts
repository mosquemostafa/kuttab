import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  createFeedbackSchema,
  listFeedbacksQuerySchema,
  updateFeedbackStatusSchema,
} from "@/server/modules/feedbacks/feedback.dto";
import { feedbackService } from "@/server/modules/feedbacks/feedback.service";
import { validateBody } from "@/server/pipes/validate.pipe";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import { getUserId, getUserRole } from "@/server/utils/request-user";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

function ok<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

function getLocaleFromRequest(req: NextRequest): string {
  const maybeLocale = req.nextUrl.pathname.split("/").filter(Boolean)[0];

  return hasLocale(routing.locales, maybeLocale)
    ? maybeLocale
    : routing.defaultLocale;
}

export const feedbackController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);

    const parsed = listFeedbacksQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      sortDirection: searchParams.get("sortDirection") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const pagination = parsePagination(searchParams);
    const userId = getUserId(req);

    const result = await feedbackService.listMyFeedbacks(userId, pagination, {
      status: parsed.status,
      type: parsed.type,
      sortDirection: parsed.sortDirection,
    });

    return ok(result.items, result.meta);
  },

  async listAllForStaff(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);

    const parsed = listFeedbacksQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      sortDirection: searchParams.get("sortDirection") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const pagination = parsePagination(searchParams);

    const result = await feedbackService.listAllFeedbacks(pagination, {
      status: parsed.status,
      type: parsed.type,
      sortDirection: parsed.sortDirection,
    });

    return ok(result.items, result.meta);
  },

  async getById(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    const role = getUserRole(req);
    const result = await feedbackService.getFeedbackById(id, userId, role);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createFeedbackSchema, body);
    const userId = getUserId(req);
    const locale = getLocaleFromRequest(req);

    const result = await feedbackService.createFeedback(userId, input, locale);
    return ok(result, undefined, 201);
  },

  async updateStatus(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateFeedbackStatusSchema, body);
    const role = getUserRole(req);

    const result = await feedbackService.updateFeedbackStatus(
      id,
      role,
      input.status,
    );

    return ok(result);
  },

  async delete(req: NextRequest, id: string): Promise<NextResponse> {
    const role = getUserRole(req);
    await feedbackService.deleteFeedback(id, role);
    return new NextResponse(null, { status: 204 });
  },
};
