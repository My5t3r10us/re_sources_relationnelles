CREATE TABLE "resource_file" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resource_file" ADD CONSTRAINT "resource_file_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;
