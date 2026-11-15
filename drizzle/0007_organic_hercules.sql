CREATE TYPE "public"."student_type_enum" AS ENUM('foundation', 'khatimeen', 'children', 'adults');--> statement-breakpoint
CREATE TYPE "public"."teacher_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"phone" text,
	"student_type" "student_type_enum",
	"status" "teacher_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teachers_user_id_idx" ON "teachers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teachers_status_idx" ON "teachers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "teachers_name_idx" ON "teachers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "teachers_student_type_idx" ON "teachers" USING btree ("student_type");--> statement-breakpoint
CREATE INDEX "teachers_created_at_idx" ON "teachers" USING btree ("created_at");