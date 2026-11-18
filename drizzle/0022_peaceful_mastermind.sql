DROP INDEX "students_user_id_idx";--> statement-breakpoint
DROP INDEX "teachers_user_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "students_user_id_unique" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teachers_user_id_unique" ON "teachers" USING btree ("user_id");