import { createId } from "@paralleldrive/cuid2";
import { date, index, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { teacher } from "@/server/modules/teachers/teacher.entity";
import { user } from "@/server/modules/users/user.entity";

export const latenessPeriodEnum = pgEnum("lateness_period_enum", [
  "from_35_to_45_min",
  "from_45_to_60_min",
  "more_than_60_min",
  "excused_absence",
]);

export const teacherAttendance = pgTable(
  "teacher_attendances",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teacher.id, { onDelete: "cascade" }),
    attendanceDate: date("attendance_date").notNull(),
    latenessPeriod: latenessPeriodEnum("lateness_period"),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("teacher_attendances_teacher_date_unique").on(
      table.teacherId,
      table.attendanceDate,
    ),
    index("teacher_attendances_teacher_id_idx").on(table.teacherId),
    index("teacher_attendances_date_idx").on(table.attendanceDate),
    index("teacher_attendances_recorded_by_idx").on(table.recordedBy),
  ],
);
