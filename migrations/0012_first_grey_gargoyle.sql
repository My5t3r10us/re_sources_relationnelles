ALTER TABLE "auth_log" ADD COLUMN "target_type" text;--> statement-breakpoint
ALTER TABLE "auth_log" ADD COLUMN "target_id" text;--> statement-breakpoint
ALTER TABLE "auth_log" ADD COLUMN "metadata" text;