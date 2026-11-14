import { createId } from "@paralleldrive/cuid2";
import {
  and,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/server/db";
import {
  announcement,
  usersAnnouncement,
} from "@/server/modules/announcements/announcement.entity";
import { segment } from "@/server/modules/segments/segment.entity";
import { user } from "@/server/modules/users/user.entity";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import type { AnnouncementType } from "@/shared/enums/announcement-type.enum";

type CreateAnnouncementInput = {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  type: AnnouncementType;
  targetType: "all" | "role" | "segment";
  targetValue: string | null;
  createdBy: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
};

type AnnouncementAnalyticsRow = {
  total: number;
  typeFeature: number;
  typeImprovement: number;
  typeFix: number;
  typeMaintenance: number;
  typeAlert: number;
  typePromotion: number;
  statusDraft: number;
  statusPublished: number;
  activeCount: number;
};

function toInt(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number.parseInt(value, 10) || 0;
  return Number(value) || 0;
}

function getUserTargetedAnnouncements(userId: string) {
  return db
    .select({
      id: announcement.id,
      titleAr: announcement.titleAr,
      titleEn: announcement.titleEn,
      contentAr: announcement.contentAr,
      contentEn: announcement.contentEn,
      type: announcement.type,
      targetType: announcement.targetType,
      targetValue: announcement.targetValue,
      createdBy: announcement.createdBy,
      createdAt: announcement.createdAt,
      publishedAt: announcement.publishedAt,
      expiresAt: announcement.expiresAt,
    })
    .from(announcement)
    .innerJoin(user, eq(user.id, userId))
    .where(
      and(
        isNotNull(announcement.publishedAt),
        or(
          isNull(announcement.expiresAt),
          gt(announcement.expiresAt, new Date()),
        ),
        or(
          eq(announcement.targetType, "all"),
          and(
            eq(announcement.targetType, "role"),
            eq(announcement.targetValue, user.role),
          ),
          and(
            eq(announcement.targetType, "segment"),
            eq(announcement.targetValue, user.segmentId),
          ),
        ),
      ),
    );
}

export const announcementRepository = {
  getUserTargetedAnnouncements,

  async findById(id: string) {
    const [item] = await db
      .select({
        id: announcement.id,
        titleAr: announcement.titleAr,
        titleEn: announcement.titleEn,
        contentAr: announcement.contentAr,
        contentEn: announcement.contentEn,
        type: announcement.type,
        targetType: announcement.targetType,
        targetValue: announcement.targetValue,
        createdBy: announcement.createdBy,
        createdAt: announcement.createdAt,
        publishedAt: announcement.publishedAt,
        expiresAt: announcement.expiresAt,
      })
      .from(announcement)
      .where(eq(announcement.id, id))
      .limit(1);

    return item ?? null;
  },

  async getUnseenCount(userId: string): Promise<number> {
    const targeted = getUserTargetedAnnouncements(userId).as("targeted");

    const [row] = await db
      .select({ count: count() })
      .from(targeted)
      .leftJoin(
        usersAnnouncement,
        and(
          eq(usersAnnouncement.userId, userId),
          eq(usersAnnouncement.announcementId, targeted.id),
        ),
      )
      .where(isNull(usersAnnouncement.id));

    return row?.count ?? 0;
  },

  async getUnseen(userId: string) {
    const targeted = getUserTargetedAnnouncements(userId).as("targeted");

    return db
      .select({
        id: targeted.id,
        titleAr: targeted.titleAr,
        titleEn: targeted.titleEn,
        contentAr: targeted.contentAr,
        contentEn: targeted.contentEn,
        type: targeted.type,
        publishedAt: targeted.publishedAt,
      })
      .from(targeted)
      .leftJoin(
        usersAnnouncement,
        and(
          eq(usersAnnouncement.userId, userId),
          eq(usersAnnouncement.announcementId, targeted.id),
        ),
      )
      .where(isNull(usersAnnouncement.id))
      .orderBy(desc(targeted.publishedAt));
  },

  async markSeen(userId: string, announcementIds: string[]): Promise<void> {
    const distinctIds = Array.from(new Set(announcementIds));

    if (distinctIds.length === 0) {
      return;
    }

    const now = new Date();

    await db
      .insert(usersAnnouncement)
      .values(
        distinctIds.map((announcementId) => ({
          id: createId(),
          userId,
          announcementId,
          seenAt: now,
        })),
      )
      .onConflictDoNothing({
        target: [usersAnnouncement.userId, usersAnnouncement.announcementId],
      });
  },

  async listForUser(userId: string, pagination: ParsedPagination) {
    const targeted = getUserTargetedAnnouncements(userId).as("targeted");

    const [items, totalRows] = await Promise.all([
      db
        .select({
          id: targeted.id,
          titleAr: targeted.titleAr,
          titleEn: targeted.titleEn,
          contentAr: targeted.contentAr,
          contentEn: targeted.contentEn,
          type: targeted.type,
          publishedAt: targeted.publishedAt,
          seenAt: usersAnnouncement.seenAt,
        })
        .from(targeted)
        .leftJoin(
          usersAnnouncement,
          and(
            eq(usersAnnouncement.userId, userId),
            eq(usersAnnouncement.announcementId, targeted.id),
          ),
        )
        .orderBy(desc(targeted.publishedAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: count() }).from(targeted),
    ]);

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  },

  async create(input: CreateAnnouncementInput) {
    const [created] = await db
      .insert(announcement)
      .values({
        id: createId(),
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        contentAr: input.contentAr,
        contentEn: input.contentEn,
        type: input.type,
        targetType: input.targetType,
        targetValue: input.targetValue,
        createdBy: input.createdBy,
        publishedAt: input.publishedAt,
        expiresAt: input.expiresAt,
      })
      .returning();

    return created;
  },

  async update(
    id: string,
    input: {
      titleAr: string;
      titleEn: string;
      contentAr: string;
      contentEn: string;
      publishedAt: Date | null;
      expiresAt: Date | null;
      targetType?: "all" | "role" | "segment";
      targetValue?: string | null;
    },
  ) {
    const updates: {
      titleAr: string;
      titleEn: string;
      contentAr: string;
      contentEn: string;
      publishedAt: Date | null;
      expiresAt: Date | null;
      targetType?: "all" | "role" | "segment";
      targetValue?: string | null;
    } = {
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      contentAr: input.contentAr,
      contentEn: input.contentEn,
      publishedAt: input.publishedAt,
      expiresAt: input.expiresAt,
    };

    if (input.targetType !== undefined) {
      updates.targetType = input.targetType;
      updates.targetValue =
        input.targetType === "all" ? null : (input.targetValue ?? null);
    }

    const [updated] = await db
      .update(announcement)
      .set(updates)
      .where(eq(announcement.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string) {
    const [deleted] = await db
      .delete(announcement)
      .where(eq(announcement.id, id))
      .returning({ id: announcement.id });

    return Boolean(deleted);
  },

  async listAdmin(pagination: ParsedPagination) {
    const [items, totalRows] = await Promise.all([
      db
        .select({
          id: announcement.id,
          titleAr: announcement.titleAr,
          titleEn: announcement.titleEn,
          contentAr: announcement.contentAr,
          contentEn: announcement.contentEn,
          type: announcement.type,
          targetType: announcement.targetType,
          targetValue: announcement.targetValue,
          targetLabel: segment.name,
          createdBy: announcement.createdBy,
          createdAt: announcement.createdAt,
          publishedAt: announcement.publishedAt,
          expiresAt: announcement.expiresAt,
          seenCount: count(usersAnnouncement.id),
        })
        .from(announcement)
        .leftJoin(
          segment,
          and(
            eq(announcement.targetType, "segment"),
            eq(announcement.targetValue, segment.id),
          ),
        )
        .leftJoin(
          usersAnnouncement,
          eq(usersAnnouncement.announcementId, announcement.id),
        )
        .groupBy(announcement.id, segment.name)
        .orderBy(desc(announcement.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: count() }).from(announcement),
    ]);

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  },

  async listVisibleUnseenIds(userId: string, ids: string[]) {
    if (ids.length === 0) {
      return [] as string[];
    }

    const targeted = getUserTargetedAnnouncements(userId).as("targeted");

    const rows = await db
      .select({ id: targeted.id })
      .from(targeted)
      .leftJoin(
        usersAnnouncement,
        and(
          eq(usersAnnouncement.userId, userId),
          eq(usersAnnouncement.announcementId, targeted.id),
        ),
      )
      .where(and(inArray(targeted.id, ids), isNull(usersAnnouncement.id)));

    return rows.map((row) => row.id);
  },

  async getSeenCountByAnnouncementId(announcementId: string): Promise<number> {
    const [row] = await db
      .select({ value: count(usersAnnouncement.id) })
      .from(usersAnnouncement)
      .where(eq(usersAnnouncement.announcementId, announcementId));

    const raw = row?.value;
    if (typeof raw === "number") {
      return raw;
    }

    const parsed = Number.parseInt(raw ?? "0", 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  },

  async getAnalytics(anchor: Date): Promise<AnnouncementAnalyticsRow> {
    const [row] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        typeFeature: sql<number>`cast(count(*) filter (where ${announcement.type} = 'feature') as int)`,
        typeImprovement: sql<number>`cast(count(*) filter (where ${announcement.type} = 'improvement') as int)`,
        typeFix: sql<number>`cast(count(*) filter (where ${announcement.type} = 'fix') as int)`,
        typeMaintenance: sql<number>`cast(count(*) filter (where ${announcement.type} = 'maintenance') as int)`,
        typeAlert: sql<number>`cast(count(*) filter (where ${announcement.type} = 'alert') as int)`,
        typePromotion: sql<number>`cast(count(*) filter (where ${announcement.type} = 'promotion') as int)`,
        statusDraft: sql<number>`cast(count(*) filter (where ${announcement.publishedAt} is null) as int)`,
        statusPublished: sql<number>`cast(count(*) filter (where ${announcement.publishedAt} is not null) as int)`,
        activeCount: sql<number>`cast(count(*) filter (where ${announcement.publishedAt} is not null and ${announcement.publishedAt} <= ${anchor} and (${announcement.expiresAt} is null or ${announcement.expiresAt} > ${anchor})) as int)`,
      })
      .from(announcement);

    return {
      total: toInt(row?.total),
      typeFeature: toInt(row?.typeFeature),
      typeImprovement: toInt(row?.typeImprovement),
      typeFix: toInt(row?.typeFix),
      typeMaintenance: toInt(row?.typeMaintenance),
      typeAlert: toInt(row?.typeAlert),
      typePromotion: toInt(row?.typePromotion),
      statusDraft: toInt(row?.statusDraft),
      statusPublished: toInt(row?.statusPublished),
      activeCount: toInt(row?.activeCount),
    };
  },
};
