import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

export const blogStatusEnum = pgEnum("blog_status", [
  "draft",
  "published",
  "archived",
]);

export const blog = pgTable(
  "blogs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en").notNull(),
    descriptionAr: text("description_ar").notNull(),
    descriptionEn: text("description_en").notNull(),
    slug: text("slug").notNull(),
    contentAr: text("content_ar").notNull(),
    contentEn: text("content_en").notNull(),
    coverImageUrl: text("cover_image_url").notNull(),
    excerptAr: text("excerpt_ar").notNull(),
    excerptEn: text("excerpt_en").notNull(),
    readingMinutes: integer("reading_minutes").default(1).notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: blogStatusEnum("status")
      .$defaultFn(() => "draft")
      .notNull(),
    isFeatured: boolean("is_featured")
      .$defaultFn(() => false)
      .notNull(),
    publishDate: timestamp("publish_date"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("blog_slug_unique_idx").on(table.slug),
    index("blog_author_id_idx").on(table.authorId),
    index("blog_status_idx").on(table.status),
    index("blog_publish_date_idx").on(table.publishDate),
    index("blog_is_featured_idx").on(table.isFeatured),
  ],
);
