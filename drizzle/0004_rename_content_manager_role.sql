UPDATE "users" SET "role" = 'content' WHERE "role" = 'content_manager';--> statement-breakpoint
UPDATE "announcements" SET "target_value" = 'content' WHERE "target_type" = 'role' AND "target_value" = 'content_manager';
