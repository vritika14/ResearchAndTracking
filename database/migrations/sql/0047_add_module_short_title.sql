ALTER TABLE "modules" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "short_title" text;
--> statement-breakpoint
-- Backfill: every existing paper's current title becomes its short (working)
-- title. The formal title column stays populated with the same value for
-- now — nothing is cleared — and can be edited independently going forward.
UPDATE "modules" SET "short_title" = "title" WHERE "short_title" IS NULL;
