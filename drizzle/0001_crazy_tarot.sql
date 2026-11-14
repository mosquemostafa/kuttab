DROP TABLE "invoices" CASCADE;--> statement-breakpoint
DROP TABLE "subscriptions" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_events" CASCADE;--> statement-breakpoint
DROP TABLE "coupons" CASCADE;--> statement-breakpoint
DROP TABLE "coupon_usages" CASCADE;--> statement-breakpoint
DROP TYPE "public"."invoice_currency";--> statement-breakpoint
DROP TYPE "public"."invoice_payment_method";--> statement-breakpoint
DROP TYPE "public"."invoice_status";--> statement-breakpoint
DROP TYPE "public"."payment_gateway";--> statement-breakpoint
DROP TYPE "public"."subscription_activated_by";--> statement-breakpoint
DROP TYPE "public"."subscription_event_type";--> statement-breakpoint
DROP TYPE "public"."subscription_plan";--> statement-breakpoint
DROP TYPE "public"."coupon_discount_type";--> statement-breakpoint
DROP TYPE "public"."coupon_type";