-- Remove "shared" value from resource_privacy enum
-- Postgres does not allow direct removal of enum values, so we recreate the enum.

-- Step 1: convert any existing "shared" resources to "public"
UPDATE "resource" SET "privacy" = 'public' WHERE "privacy" = 'shared';--> statement-breakpoint

-- Step 2: rename the current enum
ALTER TYPE "public"."resource_privacy" RENAME TO "resource_privacy_old";--> statement-breakpoint

-- Step 3: create the new enum without "shared"
CREATE TYPE "public"."resource_privacy" AS ENUM('public', 'private');--> statement-breakpoint

-- Step 4: convert the column type to the new enum
ALTER TABLE "resource" ALTER COLUMN "privacy" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "resource" ALTER COLUMN "privacy" TYPE "public"."resource_privacy" USING "privacy"::text::"public"."resource_privacy";--> statement-breakpoint
ALTER TABLE "resource" ALTER COLUMN "privacy" SET DEFAULT 'public';--> statement-breakpoint

-- Step 5: drop the old enum
DROP TYPE "public"."resource_privacy_old";
