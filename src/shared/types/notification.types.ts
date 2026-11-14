import type { NotificationType } from "@/shared/constants/notification-types";

export type NotificationDto = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationDto[];
  nextCursor: string | null;
};
