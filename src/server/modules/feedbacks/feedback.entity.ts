import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

export const feedback = pgTable("feedbacks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["suggestion", "complaint"] }).notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["new", "reviewed", "closed"] })
    .$defaultFn(() => "new")
    .notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
