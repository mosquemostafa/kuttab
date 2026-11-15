CREATE TYPE "public"."student_payment_method" AS ENUM('exempt_poor', 'installments', 'exempt_staff_kids', 'special', 'monthly', 'sponsored');--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "payment_method" "student_payment_method";--> statement-breakpoint
CREATE INDEX "students_payment_method_idx" ON "students" USING btree ("payment_method");