CREATE TYPE "public"."student_status" AS ENUM('active', 'archived', 'rejected');--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"birth_date" date,
	"grade" text,
	"job" text,
	"phone" text,
	"studied_tajweed" boolean DEFAULT false NOT NULL,
	"previously_enrolled" boolean DEFAULT false NOT NULL,
	"previous_enrolled_place" text,
	"memorized_parts_count" integer DEFAULT 0 NOT NULL,
	"memorization_details" text,
	"status" "student_status" DEFAULT 'active' NOT NULL,
	"registration_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "students_user_id_idx" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("status");--> statement-breakpoint
CREATE INDEX "students_name_idx" ON "students" USING btree ("name");--> statement-breakpoint
CREATE INDEX "students_phone_idx" ON "students" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "students_created_at_idx" ON "students" USING btree ("created_at");