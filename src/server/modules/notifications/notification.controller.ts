import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { NotFoundException } from "@/server/exceptions/exceptions";
import {
  adminCreateNotificationSchema,
  notificationIdParamSchema,
  parseListNotificationsQuery,
  parseReadNotificationsQuery,
} from "@/server/modules/notifications/notification.dto";
import { notificationService } from "@/server/modules/notifications/notification.service";
import { userRepository } from "@/server/modules/users/user.repository";
import { validateBody } from "@/server/pipes/validate.pipe";
import { getUserId } from "@/server/utils/request-user";
import type { ApiSuccess } from "@/shared/types/api-response.types";

function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export const notificationController = {
  async unreadCount(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const count = await notificationService.getUnreadCount(userId);
    return ok({ count });
  },

  async list(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const { unreadOnly, limit, cursorDate } = parseListNotificationsQuery(
      new URL(req.url).searchParams,
    );

    const result = await notificationService.listForUser(userId, {
      unreadOnly,
      cursor: cursorDate,
      limit,
    });

    return ok(result);
  },

  async listRead(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const { limit, cursorDate } = parseReadNotificationsQuery(
      new URL(req.url).searchParams,
    );

    const result = await notificationService.listReadForUser(userId, {
      cursor: cursorDate,
      limit,
    });

    return ok(result);
  },

  async markRead(req: NextRequest, id: string): Promise<NextResponse> {
    const parsedId = notificationIdParamSchema.safeParse(id);
    if (!parsedId.success) {
      throw new NotFoundException("Notification", id);
    }

    const userId = getUserId(req);
    await notificationService.markOneRead(userId, parsedId.data);
    return ok({ marked: true as const });
  },

  async markAllRead(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    await notificationService.markAllRead(userId);
    return ok({ markedAll: true as const });
  },

  async adminCreate(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(adminCreateNotificationSchema, body);

    const userExists = await userRepository.existsById(input.userId);
    if (!userExists) {
      throw new NotFoundException("User", input.userId);
    }

    const created = await notificationService.createForUser(input.userId, {
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      metadata: input.metadata,
    });

    return ok(created, 201);
  },
};
