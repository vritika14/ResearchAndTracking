-- Seed the "visibility" enum category (Private/Shared) used by tasks and notes.
-- tasks.service.ts / notes.service.ts default to and resolve 'Private'/'Shared'
-- by name via EnumRepository.findByCategoryAndValue, which was throwing
-- NotFoundException on every task/note create because no rows existed yet.
--
-- Global values use tenant_id = NULL, matching every other pre-existing
-- category (project_status, pipeline_stage, importance, ...). The unique index
-- is (category, value, tenant_id); Postgres treats NULL <> NULL for
-- uniqueness, so ON CONFLICT would not actually prevent duplicate inserts on
-- a NULL tenant_id — use a WHERE NOT EXISTS guard instead, matching the
-- pattern already used in database/migrations/bootstrap/001_roles.sql.
INSERT INTO "enum" (category, value, sort_order, tenant_id)
SELECT 'visibility', 'Private', 1, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM "enum"
  WHERE category = 'visibility' AND value = 'Private' AND tenant_id IS NULL
);
--> statement-breakpoint
INSERT INTO "enum" (category, value, sort_order, tenant_id)
SELECT 'visibility', 'Shared', 2, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM "enum"
  WHERE category = 'visibility' AND value = 'Shared' AND tenant_id IS NULL
);
