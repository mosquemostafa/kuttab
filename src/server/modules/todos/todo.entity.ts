import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  boolean,
  date,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

import { project } from "@/server/modules/projects/project.entity";
import { user } from "@/server/modules/users/user.entity";
import type { TodoChecklistItem } from "@/shared/types/todo.types";

export const todoPriorityEnum = pgEnum("todo_priority", [
  "low",
  "medium",
  "high",
]);

export const todo = pgTable(
  "todos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    isCompleted: boolean("is_completed").notNull().default(false),
    priority: todoPriorityEnum("priority"),
    dueDate: date("due_date", { mode: "string" }),
    checklist: jsonb("checklist")
      .$type<TodoChecklistItem[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("todos_user_due_date_idx").on(table.userId, table.dueDate),
    index("todos_user_completed_due_date_idx").on(
      table.userId,
      table.isCompleted,
      table.dueDate,
    ),
    index("todos_user_project_due_date_idx").on(
      table.userId,
      table.projectId,
      table.dueDate,
    ),
  ],
);
