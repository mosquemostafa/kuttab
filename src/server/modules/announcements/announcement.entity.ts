import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

export const announcementTargetTypeEnum = pgEnum("announcement_target_type", [
  "all",
  "role",
  "segment",
]);

export const announcement = pgTable(
  "announcements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en").notNull(),
    contentAr: text("content_ar").notNull(),
    contentEn: text("content_en").notNull(),
    type: text("type").notNull(),
    targetType: announcementTargetTypeEnum("target_type").notNull(),
    targetValue: text("target_value"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    publishedAt: timestamp("published_at"),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("announcement_created_by_idx").on(table.createdBy),
    index("announcement_target_type_idx").on(table.targetType),
    index("announcement_target_type_target_value_idx").on(
      table.targetType,
      table.targetValue,
    ),
    index("announcement_published_at_idx")
      .on(table.publishedAt)
      .where(sql`${table.publishedAt} IS NOT NULL`),
    index("announcement_expires_at_idx")
      .on(table.expiresAt)
      .where(sql`${table.expiresAt} IS NOT NULL`),
  ],
);

export const usersAnnouncement = pgTable(
  "users_announcements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    announcementId: text("announcement_id")
      .notNull()
      .references(() => announcement.id, { onDelete: "cascade" }),
    seenAt: timestamp("seen_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_announcement_user_announcement_unique").on(
      table.userId,
      table.announcementId,
    ),
  ],
);
