import { createId } from "@paralleldrive/cuid2";
import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { teacher } from "@/server/modules/teachers/teacher.entity";

export const classTypeEnum = pgEnum("class_type", ["group", "individual"]);

export const classes = pgTable(
  "classes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    primaryTeacherId: text("primary_teacher_id").references(() => teacher.id, {
      onDelete: "set null",
    }),
    secondaryTeacherId: text("secondary_teacher_id").references(
      () => teacher.id,
      { onDelete: "set null" },
    ),
    classType: classTypeEnum("class_type").notNull().default("group"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("classes_primary_teacher_id_idx").on(table.primaryTeacherId),
    index("classes_secondary_teacher_id_idx").on(table.secondaryTeacherId),
    index("classes_class_type_idx").on(table.classType),
    index("classes_name_idx").on(table.name),
    index("classes_created_at_idx").on(table.createdAt),
  ],
);
