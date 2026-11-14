export const NOTIFICATION_TYPES = [
  "system",
  "announcement_reference",
  "support_ticket",
  "feedback",
  "social",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
