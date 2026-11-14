import { createId } from "@paralleldrive/cuid2";
import { boolean, pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

export const project = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    colorKey: text("color_key"),
    icon: text("icon"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("projects_user_archived_updated_idx").on(
      table.userId,
      table.isArchived,
      table.updatedAt,
    ),
  ],
);
