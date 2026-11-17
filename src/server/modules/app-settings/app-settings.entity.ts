import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

import type { DeductionDays } from "@/shared/types/teacher-attendance.types";

export const appSettings = pgTable("app_settings", {
  id: text("id")
    .$defaultFn(() => "default")
    .primaryKey(),
  organizationName: text("organization_name")
    .$defaultFn(() => "my-project")
    .notNull(),
  allowSelfRegistration: boolean("allow_self_registration")
    .$defaultFn(() => true)
    .notNull(),
  requireEmailVerification: boolean("require_email_verification")
    .$defaultFn(() => true)
    .notNull(),
  sendSupportTicketConfirmationEmail: boolean(
    "send_support_ticket_confirmation_email",
  )
    .$defaultFn(() => true)
    .notNull(),
  sendFeedbackConfirmationEmail: boolean("send_feedback_confirmation_email")
    .$defaultFn(() => true)
    .notNull(),
  forceSingleActiveSession: boolean("force_single_active_session")
    .$defaultFn(() => false)
    .notNull(),
  sendNewsletterWelcomeEmail: boolean("send_newsletter_welcome_email")
    .$defaultFn(() => false)
    .notNull(),
  workingDays: integer("working_days")
    .array()
    .notNull()
    .default(sql`'{0,1,2,3,4}'::integer[]`),
  deductionDays: jsonb("deduction_days")
    .$type<DeductionDays>()
    .notNull()
    .default(
      sql`'{"absence":1,"from_35_to_45_min":0,"from_45_to_60_min":0,"more_than_60_min":0,"excused_absence":0}'::jsonb`,
    ),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
