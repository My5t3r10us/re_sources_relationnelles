CREATE TABLE "auth_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"event" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resource" ALTER COLUMN "privacy" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "resource" ALTER COLUMN "privacy" SET DEFAULT 'public'::text;--> statement-breakpoint
DROP TYPE "public"."resource_privacy";--> statement-breakpoint
CREATE TYPE "public"."resource_privacy" AS ENUM('public', 'private');--> statement-breakpoint
ALTER TABLE "resource" ALTER COLUMN "privacy" SET DEFAULT 'public'::"public"."resource_privacy";--> statement-breakpoint
ALTER TABLE "resource" ALTER COLUMN "privacy" SET DATA TYPE "public"."resource_privacy" USING "privacy"::"public"."resource_privacy";