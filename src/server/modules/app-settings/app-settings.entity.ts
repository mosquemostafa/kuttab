import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
