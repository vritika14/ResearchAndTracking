ALTER TABLE "modules" ADD COLUMN "pipeline_stage_changed_at" timestamp with time zone;
--> statement-breakpoint
-- Backfill: existing papers have no recorded stage-change history, so treat
-- their current stage as having started at creation time. This is only a
-- reasonable default for pre-existing dev/test data — new stage moves going
-- forward are recorded accurately by the application.
UPDATE "modules" SET "pipeline_stage_changed_at" = "created_at" WHERE "pipeline_stage_changed_at" IS NULL;
