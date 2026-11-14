CREATE TYPE "public"."todo_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."blog_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."announcement_target_type" AS ENUM('all', 'role', 'segment');--> statement-breakpoint
CREATE TYPE "public"."newsletter_campaign_send_status" AS ENUM('pending', 'processing', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."newsletter_campaign_status" AS ENUM('draft', 'queued', 'sending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."newsletter_subscriber_status" AS ENUM('active', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."invoice_currency" AS ENUM('EGP', 'USD');--> statement-breakpoint
CREATE TYPE "public"."invoice_payment_method" AS ENUM('gateway', 'bank_transfer', 'vodafone_cash', 'instapay', 'complimentary', 'fix');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('paid', 'pending', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('paymob', 'kashier');--> statement-breakpoint
CREATE TYPE "public"."subscription_activated_by" AS ENUM('gateway', 'manual', 'trial');--> statement-breakpoint
CREATE TYPE "public"."subscription_event_type" AS ENUM('trial_started', 'manually_activated', 'subscription_created', 'subscription_renewed', 'subscription_cancelled', 'subscription_past_due', 'subscription_expired', 'subscription_paused', 'subscription_resumed', 'payment_success', 'payment_failed', 'payment_refunded', 'card_updated', 'card_expiring_soon', 'dispute_created', 'admin_extended', 'admin_plan_changed', 'admin_cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'trial', 'pro');--> statement-breakpoint
CREATE TYPE "public"."coupon_discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('gift', 'discount');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_name" text NOT NULL,
	"allow_self_registration" boolean NOT NULL,
	"require_email_verification" boolean NOT NULL,
	"send_support_ticket_confirmation_email" boolean NOT NULL,
	"send_feedback_confirmation_email" boolean NOT NULL,
	"force_single_active_session" boolean NOT NULL,
	"send_newsletter_welcome_email" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text,
	"segment_id" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"onboarded" boolean DEFAULT false NOT NULL,
	"is_public_knowledge_profile" boolean DEFAULT false NOT NULL,
	"knowledge_bio" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "segments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" text PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"cloudinary_url" text NOT NULL,
	"secure_url" text NOT NULL,
	"resource_type" text NOT NULL,
	"format" text,
	"width" integer,
	"height" integer,
	"bytes" bigint NOT NULL,
	"folder" text NOT NULL,
	"filename" text NOT NULL,
	"original_filename" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_files_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "user_media_files" (
	"id" text PRIMARY KEY NOT NULL,
	"object_key" text NOT NULL,
	"public_url" text NOT NULL,
	"resource_type" text NOT NULL,
	"usage_type" text NOT NULL,
	"format" text,
	"width" integer,
	"height" integer,
	"bytes" bigint NOT NULL,
	"original_filename" text,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_media_files_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color_key" text,
	"icon" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text,
	"title" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"priority" "todo_priority",
	"due_date" date,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" "support_ticket_status" NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" text PRIMARY KEY NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"description_ar" text NOT NULL,
	"description_en" text NOT NULL,
	"slug" text NOT NULL,
	"content_ar" text NOT NULL,
	"content_en" text NOT NULL,
	"cover_image_url" text NOT NULL,
	"excerpt_ar" text NOT NULL,
	"excerpt_en" text NOT NULL,
	"reading_minutes" integer DEFAULT 1 NOT NULL,
	"author_id" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "blog_status" NOT NULL,
	"is_featured" boolean NOT NULL,
	"publish_date" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blogs_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"blog_id" text NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"content_ar" text NOT NULL,
	"content_en" text NOT NULL,
	"type" text NOT NULL,
	"target_type" "announcement_target_type" NOT NULL,
	"target_value" text,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"published_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"announcement_id" text NOT NULL,
	"seen_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_ar" text NOT NULL,
	"subject_en" text NOT NULL,
	"body_ar" text NOT NULL,
	"body_en" text NOT NULL,
	"status" "newsletter_campaign_status" NOT NULL,
	"failure_reason" text,
	"created_by" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"cover_image_url" text,
	"is_website_public" boolean DEFAULT false NOT NULL,
	"slug" text,
	"excerpt_ar" text,
	"excerpt_en" text,
	"resume_generation" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaign_sends" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"status" "newsletter_campaign_send_status" NOT NULL,
	"resend_message_id" text,
	"error" text,
	"locked_until" timestamp,
	"claimed_by" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"locale" text,
	"status" "newsletter_subscriber_status" NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" "invoice_currency" DEFAULT 'EGP' NOT NULL,
	"status" "invoice_status" NOT NULL,
	"refunded_amount" integer,
	"refund_reason" text,
	"payment_method" "invoice_payment_method" NOT NULL,
	"gateway" "payment_gateway",
	"gateway_payment_id" text,
	"payment_reference" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_refunded_amount_required_when_refunded_ck" CHECK ("invoices"."status" NOT IN ('refunded', 'partially_refunded') OR "invoices"."refunded_amount" IS NOT NULL),
	CONSTRAINT "invoices_refund_reason_required_when_refunded_ck" CHECK ("invoices"."status" NOT IN ('refunded', 'partially_refunded') OR "invoices"."refund_reason" IS NOT NULL),
	CONSTRAINT "invoices_amount_non_negative_ck" CHECK ("invoices"."amount" >= 0),
	CONSTRAINT "invoices_refunded_amount_non_negative_ck" CHECK ("invoices"."refunded_amount" IS NULL OR "invoices"."refunded_amount" >= 0),
	CONSTRAINT "invoices_refunded_amount_lte_amount_ck" CHECK ("invoices"."refunded_amount" IS NULL OR "invoices"."refunded_amount" <= "invoices"."amount")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"plan_started_at" timestamp NOT NULL,
	"plan_expires_at" timestamp NOT NULL,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"trial_used" boolean DEFAULT false NOT NULL,
	"activated_by" "subscription_activated_by" NOT NULL,
	"activated_by_user_id" text,
	"activated_at" timestamp NOT NULL,
	"notes" text,
	"gateway" "payment_gateway",
	"gateway_subscription_id" text,
	"gateway_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_manual_activation_requires_admin_ck" CHECK ("subscriptions"."activated_by" != 'manual' OR "subscriptions"."activated_by_user_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "subscription_events" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"event_type" "subscription_event_type" NOT NULL,
	"gateway" "payment_gateway",
	"gateway_event_id" text,
	"notes" text,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"actor_id" text
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"type" "coupon_type" NOT NULL,
	"discount_type" "coupon_discount_type",
	"discount_value" integer,
	"currency" "invoice_currency",
	"gift_plan" "subscription_plan",
	"gift_duration" integer,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"per_user_limit" integer DEFAULT 1 NOT NULL,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"applicable_plans" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_gift_fields_required_ck" CHECK ("coupons"."type" != 'gift' OR (
        "coupons"."gift_plan" IS NOT NULL AND "coupons"."gift_duration" IS NOT NULL
      )),
	CONSTRAINT "coupons_discount_fields_required_ck" CHECK ("coupons"."type" != 'discount' OR (
        "coupons"."discount_type" IS NOT NULL AND "coupons"."discount_value" IS NOT NULL
      )),
	CONSTRAINT "coupons_currency_required_for_fixed_ck" CHECK ("coupons"."discount_type" IS NULL OR
          "coupons"."discount_type" != 'fixed' OR
          "coupons"."currency" IS NOT NULL),
	CONSTRAINT "coupons_percentage_max_ck" CHECK ("coupons"."discount_type" IS NULL OR
          "coupons"."discount_type" != 'percentage' OR
          "coupons"."discount_value" <= 100),
	CONSTRAINT "coupons_discount_value_positive_ck" CHECK ("coupons"."discount_value" IS NULL OR "coupons"."discount_value" > 0),
	CONSTRAINT "coupons_gift_duration_positive_ck" CHECK ("coupons"."gift_duration" IS NULL OR "coupons"."gift_duration" > 0),
	CONSTRAINT "coupons_usage_count_non_negative_ck" CHECK ("coupons"."usage_count" >= 0),
	CONSTRAINT "coupons_per_user_limit_positive_ck" CHECK ("coupons"."per_user_limit" > 0),
	CONSTRAINT "coupons_dates_order_ck" CHECK ("coupons"."starts_at" IS NULL OR
          "coupons"."expires_at" IS NULL OR
          "coupons"."starts_at" < "coupons"."expires_at")
);
--> statement-breakpoint
CREATE TABLE "coupon_usages" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"user_id" text NOT NULL,
	"invoice_id" text,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_media_files" ADD CONSTRAINT "user_media_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blogs_comments" ADD CONSTRAINT "blogs_comments_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blogs_comments" ADD CONSTRAINT "blogs_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_announcements" ADD CONSTRAINT "users_announcements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_announcements" ADD CONSTRAINT "users_announcements_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_sends" ADD CONSTRAINT "newsletter_campaign_sends_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_sends" ADD CONSTRAINT "newsletter_campaign_sends_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_activated_by_user_id_users_id_fk" FOREIGN KEY ("activated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_segment_id_idx" ON "users" USING btree ("segment_id");--> statement-breakpoint
CREATE INDEX "media_files_uploaded_by_idx" ON "media_files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "media_files_folder_idx" ON "media_files" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "media_files_filename_idx" ON "media_files" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "media_files_resource_type_idx" ON "media_files" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "media_files_created_at_idx" ON "media_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_media_files_uploaded_by_idx" ON "user_media_files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "user_media_files_usage_type_idx" ON "user_media_files" USING btree ("usage_type");--> statement-breakpoint
CREATE INDEX "user_media_files_created_at_idx" ON "user_media_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "projects_user_archived_updated_idx" ON "projects" USING btree ("user_id","is_archived","updated_at");--> statement-breakpoint
CREATE INDEX "todos_user_due_date_idx" ON "todos" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "todos_user_completed_due_date_idx" ON "todos" USING btree ("user_id","is_completed","due_date");--> statement-breakpoint
CREATE INDEX "todos_user_project_due_date_idx" ON "todos" USING btree ("user_id","project_id","due_date");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_ticket_id_idx" ON "support_ticket_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_sender_id_idx" ON "support_ticket_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_created_at_idx" ON "support_ticket_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_slug_unique_idx" ON "blogs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_author_id_idx" ON "blogs" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blog_status_idx" ON "blogs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_publish_date_idx" ON "blogs" USING btree ("publish_date");--> statement-breakpoint
CREATE INDEX "blog_is_featured_idx" ON "blogs" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "blogs_comments_blog_id_created_at_idx" ON "blogs_comments" USING btree ("blog_id","created_at");--> statement-breakpoint
CREATE INDEX "announcement_created_by_idx" ON "announcements" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "announcement_target_type_idx" ON "announcements" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "announcement_target_type_target_value_idx" ON "announcements" USING btree ("target_type","target_value");--> statement-breakpoint
CREATE INDEX "announcement_published_at_idx" ON "announcements" USING btree ("published_at") WHERE "announcements"."published_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "announcement_expires_at_idx" ON "announcements" USING btree ("expires_at") WHERE "announcements"."expires_at" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_announcement_user_announcement_unique" ON "users_announcements" USING btree ("user_id","announcement_id");--> statement-breakpoint
CREATE INDEX "notification_user_id_is_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notification_user_id_created_at_idx" ON "notifications" USING btree ("user_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "newsletter_campaign_status_idx" ON "newsletter_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_created_by_idx" ON "newsletter_campaigns" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_public_list_idx" ON "newsletter_campaigns" USING btree ("is_website_public","status","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaigns_slug_unique" ON "newsletter_campaigns" USING btree ("slug") WHERE "newsletter_campaigns"."slug" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_campaign_send_campaign_subscriber_unique" ON "newsletter_campaign_sends" USING btree ("campaign_id","subscriber_id");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_send_campaign_id_idx" ON "newsletter_campaign_sends" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_send_campaign_status_idx" ON "newsletter_campaign_sends" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_send_status_created_idx" ON "newsletter_campaign_sends" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "newsletter_subscriber_created_at_idx" ON "newsletter_subscribers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invoices_subscription_id_created_at_idx" ON "invoices" USING btree ("subscription_id","created_at");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_payment_method_idx" ON "invoices" USING btree ("payment_method");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_gateway_payment_unique" ON "invoices" USING btree ("gateway","gateway_payment_id") WHERE "invoices"."gateway" IS NOT NULL AND "invoices"."gateway_payment_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_id_unique" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions" USING btree ("plan");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_expires_at_idx" ON "subscriptions" USING btree ("plan_expires_at");--> statement-breakpoint
CREATE INDEX "subscriptions_gateway_subscription_id_idx" ON "subscriptions" USING btree ("gateway_subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_events_subscription_id_created_at_idx" ON "subscription_events" USING btree ("subscription_id","created_at");--> statement-breakpoint
CREATE INDEX "subscription_events_event_type_idx" ON "subscription_events" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_events_gateway_event_unique" ON "subscription_events" USING btree ("gateway","gateway_event_id") WHERE "subscription_events"."gateway" IS NOT NULL AND "subscription_events"."gateway_event_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_unique" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupons_type_is_active_idx" ON "coupons" USING btree ("type","is_active");--> statement-breakpoint
CREATE INDEX "coupons_expires_at_idx" ON "coupons" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "coupon_usages_coupon_id_idx" ON "coupon_usages" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_user_id_idx" ON "coupon_usages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_coupon_user_idx" ON "coupon_usages" USING btree ("coupon_id","user_id");