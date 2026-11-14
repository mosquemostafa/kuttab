import { createId } from "@paralleldrive/cuid2";
import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

/**
 * User-owned media (R2). Admin/system assets remain in `media_files` (Cloudinary).
 */
export const userMediaFile = pgTable(
  "user_media_files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    objectKey: text("object_key").notNull().unique(),
    publicUrl: text("public_url").notNull(),
    resourceType: text("resource_type").notNull(),
    usageType: text("usage_type").notNull(),
    format: text("format"),
    width: integer("width"),
    height: integer("height"),
    bytes: bigint("bytes", { mode: "number" }).notNull(),
    originalFilename: text("original_filename"),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("user_media_files_uploaded_by_idx").on(table.uploadedBy),
    index("user_media_files_usage_type_idx").on(table.usageType),
    index("user_media_files_created_at_idx").on(table.createdAt),
  ],
);
