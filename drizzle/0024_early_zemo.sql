CREATE TYPE "public"."student_subscription_type" AS ENUM('monthly', 'yearly', 'installments');--> statement-breakpoint
DELETE FROM "student_subscriptions"
WHERE "type"::text IN ('exempt_poor', 'exempt_staff_kids', 'special', 'sponsored');--> statement-breakpoint
ALTER TABLE "student_subscriptions" ALTER COLUMN "type" SET DATA TYPE "public"."student_subscription_type" USING "type"::text::"public"."student_subscription_type";