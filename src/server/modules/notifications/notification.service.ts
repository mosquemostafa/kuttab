import {
  NotFoundException,
  ValidationException,
} from "@/server/exceptions/exceptions";
import { notificationCreatePayloadSchema } from "@/server/modules/notifications/notification.dto";
import { notificationRepository } from "@/server/modules/notifications/notification.repository";

import type { NotificationCreatePayload } from "@/server/modules/notifications/notification.dto";
import type { NotificationDto } from "@/shared/types/notification.types";
import type { NotificationListResponse } from "@/shared/types/notification.types";

function toDto(row: {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: unknown;
  isRead: boolean;
  createdAt: Date;
}): NotificationDto {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationDto["type"],
    title: row.title,
    message: row.message,
    link: row.link,
    metadata:
      row.metadata != null &&
      typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Server-only API for route handlers, admin, and other modules. */
export const notificationService = {
  async createForUser(
    userId: string,
    payload: NotificationCreatePayload,
  ): Promise<NotificationDto> {
    const parsed = notificationCreatePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationException(parsed.error.flatten().fieldErrors);
    }

    const row = await notificationRepository.insert(userId, parsed.data);
    return toDto(row);
  },

  async createForUsers(
    userIds: string[],
    payload: NotificationCreatePayload,
  ): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    const parsed = notificationCreatePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationException(parsed.error.flatten().fieldErrors);
    }

    await notificationRepository.insertMany(userIds, parsed.data);
  },

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  },

  async listForUser(
    userId: string,
    options: {
      unreadOnly: boolean;
      cursor?: Date;
      limit: number;
    },
  ): Promise<NotificationListResponse> {
    const rows = await notificationRepository.listForUser(userId, options);
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const nextCursor =
      hasMore && page.length > 0
        ? page[page.length - 1]!.createdAt.toISOString()
        : null;

    return {
      items: page.map(toDto),
      nextCursor,
    };
  },

  async listReadForUser(
    userId: string,
    options: {
      cursor?: Date;
      limit: number;
    },
  ): Promise<NotificationListResponse> {
    const rows = await notificationRepository.listReadForUser(userId, options);
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const nextCursor =
      hasMore && page.length > 0
        ? page[page.length - 1]!.createdAt.toISOString()
        : null;

    return {
      items: page.map(toDto),
      nextCursor,
    };
  },

  async markOneRead(userId: string, id: string): Promise<void> {
    const ok = await notificationRepository.markOneRead(userId, id);
    if (!ok) {
      throw new NotFoundException("Notification", id);
    }
  },

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
  },

  async hasUnreadForTicket(userId: string, ticketId: string): Promise<boolean> {
    return notificationRepository.hasUnreadForTicket(userId, ticketId);
  },

  async findUserIdsWithUnreadTicket(
    userIds: string[],
    ticketId: string,
  ): Promise<Set<string>> {
    return notificationRepository.findUserIdsWithUnreadTicket(
      userIds,
      ticketId,
    );
  },
};
