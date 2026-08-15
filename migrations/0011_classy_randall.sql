CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"last_request" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
