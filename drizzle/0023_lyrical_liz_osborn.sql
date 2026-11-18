CREATE TABLE "student_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"amount" integer NOT NULL,
	"date" date NOT NULL,
	"type" "student_payment_method" NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_subscriptions" ADD CONSTRAINT "student_subscriptions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_subscriptions_student_id_idx" ON "student_subscriptions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_subscriptions_date_idx" ON "student_subscriptions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "student_subscriptions_type_idx" ON "student_subscriptions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "student_subscriptions_student_date_idx" ON "student_subscriptions" USING btree ("student_id","date");