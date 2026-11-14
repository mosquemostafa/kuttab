import type { AnnouncementType } from "@/shared/enums/announcement-type.enum";

export type AnnouncementTargetType = "all" | "role" | "segment";

export interface AnnouncementDTO {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  type: AnnouncementType;
  publishedAt: string;
}

export interface AnnouncementHistoryItemDTO extends AnnouncementDTO {
  seen: boolean;
}

export interface AdminAnnouncementDTO {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  type: AnnouncementType;
  targetType: AnnouncementTargetType;
  targetValue: string | null;
  targetLabel: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  seenCount: number;
}
