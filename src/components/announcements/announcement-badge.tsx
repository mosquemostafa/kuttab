"use client";

import { Badge } from "@/components/ui/badge";
import { useAnnouncements } from "@/components/announcements/announcement-provider";

export function AnnouncementBadge() {
  const { unseenCount } = useAnnouncements();

  if (unseenCount <= 0) {
    return null;
  }

  const displayValue = unseenCount > 99 ? "99+" : String(unseenCount);

  return (
    <Badge variant="destructive" className="ms-auto h-5 min-w-5 px-1">
      {displayValue}
    </Badge>
  );
}
