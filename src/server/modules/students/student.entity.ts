import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "@/server/modules/users/user.entity";

export const studentStatusEnum = pgEnum("student_status", [
  "active",
  "archived",
  "rejected",
]);

export const student = pgTable(
  "students",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    birthDate: date("birth_date", { mode: "string" }),
    grade: text("grade"),
    job: text("job"),
    phone: text("phone"),
    studiedTajweed: boolean("studied_tajweed").notNull().default(false),
    previouslyEnrolled: boolean("previously_enrolled").notNull().default(false),
    previousEnrolledPlace: text("previous_enrolled_place"),
    memorizedPartsCount: integer("memorized_parts_count").notNull().default(0),
    memorizationDetails: text("memorization_details"),
    status: studentStatusEnum("status").notNull().default("active"),
    registrationDate: date("registration_date", { mode: "string" })
      .$defaultFn(() => new Date().toISOString().slice(0, 10))
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("students_user_id_idx").on(table.userId),
    index("students_status_idx").on(table.status),
    index("students_name_idx").on(table.name),
    index("students_phone_idx").on(table.phone),
    index("students_created_at_idx").on(table.createdAt),
  ],
);
