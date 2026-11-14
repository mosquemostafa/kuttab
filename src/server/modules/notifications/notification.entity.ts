import { createId } from "@paralleldrive/cuid2";
import { desc } from "drizzle-orm";
import {
  pgTable,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

export const notification = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("notification_user_id_is_read_idx").on(table.userId, table.isRead),
    index("notification_user_id_created_at_idx").on(
      table.userId,
      desc(table.createdAt),
    ),
  ],
);
