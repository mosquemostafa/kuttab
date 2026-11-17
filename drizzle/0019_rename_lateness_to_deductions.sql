ALTER TABLE "app_settings" RENAME COLUMN "lateness_deduction_days" TO "deduction_days";--> statement-breakpoint
ALTER TYPE "public"."lateness_period_enum" RENAME TO "attendance_deduction_type_enum";--> statement-breakpoint
ALTER TABLE "teacher_attendances" RENAME COLUMN "lateness_period" TO "attendance_deduction_type";
