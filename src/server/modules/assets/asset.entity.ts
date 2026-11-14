import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  bigint,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

export const mediaFile = pgTable(
  "media_files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    publicId: text("public_id").notNull().unique(),
    cloudinaryUrl: text("cloudinary_url").notNull(),
    secureUrl: text("secure_url").notNull(),
    resourceType: text("resource_type").notNull(),
    format: text("format"),
    width: integer("width"),
    height: integer("height"),
    bytes: bigint("bytes", { mode: "number" }).notNull(),
    folder: text("folder").notNull(),
    filename: text("filename").notNull(),
    originalFilename: text("original_filename"),
    tags: jsonb("tags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_files_uploaded_by_idx").on(table.uploadedBy),
    index("media_files_folder_idx").on(table.folder),
    index("media_files_filename_idx").on(table.filename),
    index("media_files_resource_type_idx").on(table.resourceType),
    index("media_files_created_at_idx").on(table.createdAt),
  ],
);
