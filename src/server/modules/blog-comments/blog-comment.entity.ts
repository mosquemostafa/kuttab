import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

import { blog } from "@/server/modules/blogs/blog.entity";
import { user } from "@/server/modules/users/user.entity";

export const blogsComment = pgTable(
  "blogs_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    blogId: text("blog_id")
      .notNull()
      .references(() => blog.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("blogs_comments_blog_id_created_at_idx").on(
      table.blogId,
      table.createdAt,
    ),
  ],
);
