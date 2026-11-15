CREATE TYPE "public"."class_type" AS ENUM('group', 'individual');--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"primary_teacher_id" text,
	"secondary_teacher_id" text,
	"class_type" "class_type" DEFAULT 'group' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_primary_teacher_id_teachers_id_fk" FOREIGN KEY ("primary_teacher_id") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_secondary_teacher_id_teachers_id_fk" FOREIGN KEY ("secondary_teacher_id") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "classes_primary_teacher_id_idx" ON "classes" USING btree ("primary_teacher_id");--> statement-breakpoint
CREATE INDEX "classes_secondary_teacher_id_idx" ON "classes" USING btree ("secondary_teacher_id");--> statement-breakpoint
CREATE INDEX "classes_class_type_idx" ON "classes" USING btree ("class_type");--> statement-breakpoint
CREATE INDEX "classes_name_idx" ON "classes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "classes_created_at_idx" ON "classes" USING btree ("created_at");