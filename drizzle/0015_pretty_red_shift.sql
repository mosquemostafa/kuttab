CREATE TYPE "public"."lateness_period_enum" AS ENUM('from_35_to_45_min', 'from_45_to_60_min', 'more_than_60_min');--> statement-breakpoint
CREATE TABLE "teacher_attendances" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"attendance_date" date NOT NULL,
	"lateness_period" "lateness_period_enum",
	"recorded_by" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_attendances_teacher_date_unique" ON "teacher_attendances" USING btree ("teacher_id","attendance_date");--> statement-breakpoint
CREATE INDEX "teacher_attendances_teacher_id_idx" ON "teacher_attendances" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "teacher_attendances_date_idx" ON "teacher_attendances" USING btree ("attendance_date");--> statement-breakpoint
CREATE INDEX "teacher_attendances_recorded_by_idx" ON "teacher_attendances" USING btree ("recorded_by");