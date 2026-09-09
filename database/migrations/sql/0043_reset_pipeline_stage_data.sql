-- Projects no longer have a pipeline; the only remaining pipeline is for
-- papers (the "modules" table), and it moves from a freely-editable
-- per-tenant/per-module custom stage pool to one fixed, 15-value catalog
-- that a workspace can only reorder and hide/show (never rename or add to).
--
-- This is intentionally destructive to existing pipeline-stage data (dev/test
-- only, per product decision) and idempotent so it's safe to re-run.

-- 1. Detach papers from their current stage before the old stage rows are
--    deleted, so the delete below doesn't hit an FK violation.
UPDATE "modules" SET pipeline_stage_id = NULL;

-- 2. The project pipeline is gone entirely — remove every row in that
--    category, at any scope (global defaults, tenant pool, or the
--    now-dropped per-project custom rows).
DELETE FROM "enum" WHERE category = 'project_pipeline_stage';

-- 3. Wipe the old module_pipeline_stage rows at every scope (global
--    defaults, tenant customizations, and any leftover per-module custom
--    rows) so the new fixed 15-value catalog is the only thing left.
DELETE FROM "enum" WHERE category = 'module_pipeline_stage';

-- 4. Seed the new fixed 15-value global catalog (tenant/project/module all
--    NULL). These rows are never edited directly — a tenant that reorders or
--    hides a stage gets its own copy (tenant_id set) created on first write.
INSERT INTO "enum" (category, value, sort_order, hidden)
SELECT defaults.category, defaults.value, defaults.sort_order, false
FROM (VALUES
  ('module_pipeline_stage', 'Concept, Ideation', 1),
  ('module_pipeline_stage', 'Lit Review', 2),
  ('module_pipeline_stage', 'Study Design, Protocol', 3),
  ('module_pipeline_stage', 'Ethics, Other Approvals', 4),
  ('module_pipeline_stage', 'Preparation, Setup', 5),
  ('module_pipeline_stage', 'Data Collection', 6),
  ('module_pipeline_stage', 'Data Preparation', 7),
  ('module_pipeline_stage', 'Data Analysis', 8),
  ('module_pipeline_stage', 'Interpretation & Synthesis', 9),
  ('module_pipeline_stage', 'Drafting & Writing', 10),
  ('module_pipeline_stage', 'Submitted, Under Review', 11),
  ('module_pipeline_stage', 'Revisions', 12),
  ('module_pipeline_stage', 'Accepted', 13),
  ('module_pipeline_stage', 'Dissemination', 14),
  ('module_pipeline_stage', 'Complete', 15)
) AS defaults(category, value, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM "enum" existing
  WHERE existing.tenant_id IS NULL
    AND existing.project_id IS NULL
    AND existing.module_id IS NULL
    AND existing.category = defaults.category
    AND existing.value = defaults.value
);

-- 5. Repoint every existing paper to the first stage so dev/test data isn't
--    left stageless after step 1.
UPDATE "modules"
SET pipeline_stage_id = (
  SELECT id FROM "enum"
  WHERE category = 'module_pipeline_stage'
    AND value = 'Concept, Ideation'
    AND tenant_id IS NULL
    AND project_id IS NULL
    AND module_id IS NULL
)
WHERE pipeline_stage_id IS NULL;
