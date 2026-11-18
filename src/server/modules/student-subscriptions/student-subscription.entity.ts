import { createId } from "@paralleldrive/cuid2";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { student } from "@/server/modules/students/student.entity";

export const studentSubscriptionTypeEnum = pgEnum(
  "student_subscription_type",
  ["monthly", "yearly", "installments"],
);

export const studentSubscription = pgTable(
  "student_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    type: studentSubscriptionTypeEnum("type").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("student_subscriptions_student_id_idx").on(table.studentId),
    index("student_subscriptions_date_idx").on(table.date),
    index("student_subscriptions_type_idx").on(table.type),
    index("student_subscriptions_student_date_idx").on(
      table.studentId,
      table.date,
    ),
  ],
);
