import type {
  CreateAnnouncementDTO,
  MarkAnnouncementsSeenDTO,
  UpdateAnnouncementDTO,
} from "@/server/modules/announcements/announcement.dto";
import { announcementRepository } from "@/server/modules/announcements/announcement.repository";
import { NotFoundException } from "@/server/exceptions/exceptions";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import type {
  AdminAnnouncementDTO,
  AnnouncementDTO,
  AnnouncementHistoryItemDTO,
} from "@/shared/types/announcement.types";
import { AnnouncementType } from "@/shared/enums/announcement-type.enum";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type { AdminAnnouncementAnalyticsDTO } from "@/shared/types/admin-announcement-analytics.types";
import { getDbTimeAnchor } from "@/server/db/time-anchor";

function toAnnouncementDTO(item: {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  type: string;
  publishedAt: Date | null;
}): AnnouncementDTO {
  return {
    id: item.id,
    titleAr: item.titleAr,
    titleEn: item.titleEn,
    contentAr: item.contentAr,
    contentEn: item.contentEn,
    type: item.type as AnnouncementType,
    publishedAt: (item.publishedAt ?? new Date()).toISOString(),
  };
}

function toHistoryDTO(item: {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  type: string;
  publishedAt: Date | null;
  seenAt: Date | null;
}): AnnouncementHistoryItemDTO {
  return {
    id: item.id,
    titleAr: item.titleAr,
    titleEn: item.titleEn,
    contentAr: item.contentAr,
    contentEn: item.contentEn,
    type: item.type as AnnouncementType,
    publishedAt: (item.publishedAt ?? new Date()).toISOString(),
    seen: Boolean(item.seenAt),
  };
}

function toAdminDTO(item: {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  type: string;
  targetType: "all" | "role" | "segment";
  targetValue: string | null;
  targetLabel: string | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
  seenCount: number | string;
}): AdminAnnouncementDTO {
  const seenCount =
    typeof item.seenCount === "number"
      ? item.seenCount
      : Number.parseInt(item.seenCount, 10);

  return {
    id: item.id,
    titleAr: item.titleAr,
    titleEn: item.titleEn,
    contentAr: item.contentAr,
    contentEn: item.contentEn,
    type: item.type as AnnouncementType,
    targetType: item.targetType,
    targetValue: item.targetValue,
    targetLabel: item.targetLabel,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    expiresAt: item.expiresAt?.toISOString() ?? null,
    createdBy: item.createdBy,
    createdAt: item.createdAt.toISOString(),
    seenCount: Number.isNaN(seenCount) ? 0 : seenCount,
  };
}

export const announcementService = {
  async getUnseenCount(userId: string): Promise<number> {
    return announcementRepository.getUnseenCount(userId);
  },

  async getUnseen(userId: string): Promise<AnnouncementDTO[]> {
    const rows = await announcementRepository.getUnseen(userId);
    return rows.map(toAnnouncementDTO);
  },

  async markSeen(
    userId: string,
    input: MarkAnnouncementsSeenDTO,
  ): Promise<{ marked: number }> {
    const visibleUnseenIds = await announcementRepository.listVisibleUnseenIds(
      userId,
      input.announcementIds,
    );

    await announcementRepository.markSeen(userId, visibleUnseenIds);

    return { marked: visibleUnseenIds.length };
  },

  async listForUser(
    userId: string,
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<AnnouncementHistoryItemDTO>> {
    const result = await announcementRepository.listForUser(userId, pagination);

    return {
      items: result.items.map(toHistoryDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  },

  async createAnnouncement(
    adminUserId: string,
    input: CreateAnnouncementDTO,
  ): Promise<AdminAnnouncementDTO> {
    const created = await announcementRepository.create({
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      contentAr: input.contentAr,
      contentEn: input.contentEn,
      type: input.type,
      targetType: input.targetType,
      targetValue:
        input.targetType === "all" ? null : (input.targetValue ?? null),
      createdBy: adminUserId,
      publishedAt: input.publish ? new Date() : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });

    return toAdminDTO({
      ...created,
      targetLabel: null,
      seenCount: 0,
    });
  },

  async updateAnnouncement(
    id: string,
    input: UpdateAnnouncementDTO,
  ): Promise<AdminAnnouncementDTO> {
    const existing = await announcementRepository.findById(id);

    if (!existing) {
      throw new NotFoundException("Announcement", id);
    }

    const updated = await announcementRepository.update(id, {
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      contentAr: input.contentAr,
      contentEn: input.contentEn,
      targetType: input.targetType,
      targetValue:
        input.targetType === undefined
          ? undefined
          : input.targetType === "all"
            ? null
            : (input.targetValue ?? null),
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });

    if (!updated) {
      throw new NotFoundException("Announcement", id);
    }

    const seenCount =
      await announcementRepository.getSeenCountByAnnouncementId(id);

    return toAdminDTO({
      ...updated,
      targetLabel: null,
      seenCount,
    });
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const deleted = await announcementRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException("Announcement", id);
    }
  },

  async listAdmin(
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<AdminAnnouncementDTO>> {
    const result = await announcementRepository.listAdmin(pagination);

    return {
      items: result.items.map(toAdminDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  },

  async getAnalytics(): Promise<AdminAnnouncementAnalyticsDTO> {
    const anchor = await getDbTimeAnchor();
    const row = await announcementRepository.getAnalytics(anchor);

    const total = row.total;
    const active = row.activeCount;

    return {
      generatedAt: anchor.toISOString(),
      byType: [
        { type: AnnouncementType.FEATURE, count: row.typeFeature },
        { type: AnnouncementType.IMPROVEMENT, count: row.typeImprovement },
        { type: AnnouncementType.FIX, count: row.typeFix },
        { type: AnnouncementType.MAINTENANCE, count: row.typeMaintenance },
        { type: AnnouncementType.ALERT, count: row.typeAlert },
        { type: AnnouncementType.PROMOTION, count: row.typePromotion },
      ],
      byActive: {
        active,
        notActive: Math.max(0, total - active),
      },
      byStatus: {
        draft: row.statusDraft,
        published: row.statusPublished,
      },
    };
  },
};
