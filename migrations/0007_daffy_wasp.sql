CREATE TYPE "public"."session_status" AS ENUM('active', 'ended');--> statement-breakpoint
CREATE TABLE "resource_session" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"host_id" text NOT NULL,
	"share_code" text NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	CONSTRAINT "resource_session_share_code_unique" UNIQUE("share_code")
);
--> statement-breakpoint
CREATE TABLE "session_message" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "resource" ADD COLUMN IF NOT EXISTS "region" text;--> statement-breakpoint
ALTER TABLE "resource_session" ADD CONSTRAINT "resource_session_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_session" ADD CONSTRAINT "resource_session_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_message" ADD CONSTRAINT "session_message_session_id_resource_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resource_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_message" ADD CONSTRAINT "session_message_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participant" ADD CONSTRAINT "session_participant_session_id_resource_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resource_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participant" ADD CONSTRAINT "session_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;