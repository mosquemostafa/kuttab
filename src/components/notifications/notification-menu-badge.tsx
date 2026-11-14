"use client";

import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/components/notifications/notification-provider";

export function NotificationMenuBadge() {
  const { unreadCount } = useNotifications();

  if (unreadCount <= 0) {
    return null;
  }

  const displayValue = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Badge variant="destructive" className="ms-auto h-5 min-w-5 px-1">
      {displayValue}
    </Badge>
  );
}
