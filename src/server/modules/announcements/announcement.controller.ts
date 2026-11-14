import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  createAnnouncementSchema,
  markAnnouncementsSeenSchema,
  updateAnnouncementSchema,
} from "@/server/modules/announcements/announcement.dto";
import { announcementService } from "@/server/modules/announcements/announcement.service";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import { validateBody } from "@/server/pipes/validate.pipe";
import { getUserId } from "@/server/utils/request-user";
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

export const announcementController = {
  async unseenCount(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const count = await announcementService.getUnseenCount(userId);
    return ok({ count });
  },

  async unseen(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const items = await announcementService.getUnseen(userId);
    return ok(items);
  },

  async markSeen(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(markAnnouncementsSeenSchema, body);
    const userId = getUserId(req);
    const result = await announcementService.markSeen(userId, input);
    return ok(result);
  },

  async history(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);

    const userId = getUserId(req);
    const pagination = parsePagination(searchParams);
    const result = await announcementService.listForUser(userId, pagination);

    return ok(result.items, result.meta);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createAnnouncementSchema, body);
    const userId = getUserId(req);
    const result = await announcementService.createAnnouncement(userId, input);

    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateAnnouncementSchema, body);
    const result = await announcementService.updateAnnouncement(id, input);

    return ok(result);
  },

  async delete(id: string): Promise<NextResponse> {
    await announcementService.deleteAnnouncement(id);
    return new NextResponse(null, { status: 204 });
  },

  async listAdmin(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);

    const pagination = parsePagination(searchParams);
    const result = await announcementService.listAdmin(pagination);

    return ok(result.items, result.meta);
  },

  async analytics(_req: NextRequest): Promise<NextResponse> {
    const data = await announcementService.getAnalytics();
    return ok(data);
  },
};
