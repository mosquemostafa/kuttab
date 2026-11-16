import { createId } from "@paralleldrive/cuid2";
import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

export const studentTypeEnum = pgEnum("student_type_enum", [
  "foundation",
  "khatimeen",
  "children",
  "adults",
]);

export const teacherStatusEnum = pgEnum("teacher_status", [
  "active",
  "archived",
]);

export const teacher = pgTable(
  "teachers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    phone: text("phone"),
    studentType: studentTypeEnum("student_type"),
    status: teacherStatusEnum("status").notNull().default("active"),
    sallary: integer("sallary"),
    notes: text("notes"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("teachers_user_id_idx").on(table.userId),
    index("teachers_status_idx").on(table.status),
    index("teachers_name_idx").on(table.name),
    index("teachers_student_type_idx").on(table.studentType),
    index("teachers_created_at_idx").on(table.createdAt),
  ],
);
