import type {
  NotificationDto,
  NotificationListResponse,
} from "@/shared/types/notification.types";
import { request, requestNoStore } from "@/lib/api/api-core";

export const adminNotificationsApi = {
  create: (payload: {
    userId: string;
    type: NotificationDto["type"];
    title: string;
    message: string;
    link?: string | null;
    metadata?: Record<string, unknown> | null;
  }) =>
    request<NotificationDto>("/admin/notifications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const notificationsApi = {
  unreadCount: async (): Promise<number> => {
    try {
      const { count } = await requestNoStore<{ count: number }>(
        "/notifications/unread-count",
      );
      return count;
    } catch {
      return 0;
    }
  },
  listPage: (options: {
    unreadOnly?: boolean;
    cursor?: string;
    limit?: number;
  }) => {
    const sp = new URLSearchParams();
    sp.set("unreadOnly", options.unreadOnly === false ? "false" : "true");
    sp.set("limit", String(options.limit ?? 20));
    if (options.cursor) {
      sp.set("cursor", options.cursor);
    }
    return requestNoStore<NotificationListResponse>(
      `/notifications?${sp.toString()}`,
    );
  },
  readPage: (options: { cursor?: string; limit?: number }) => {
    const sp = new URLSearchParams();
    sp.set("limit", String(options.limit ?? 20));
    if (options.cursor) {
      sp.set("cursor", options.cursor);
    }
    return requestNoStore<NotificationListResponse>(
      `/notifications/read?${sp.toString()}`,
    );
  },
  markRead: (id: string) =>
    request<{ marked: true }>(`/notifications/${id}/read`, {
      method: "PATCH",
    }).then(() => undefined),
  markAllRead: () =>
    request<{ markedAll: true }>("/notifications/mark-all-read", {
      method: "POST",
    }).then(() => undefined),
};
