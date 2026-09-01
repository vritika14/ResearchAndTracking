-- 0010_seed_enum_values seeded 'To_do' (underscore) for task_status instead of
-- 'To do' (space), inconsistent with every other multi-word enum value in this
-- table (same class of typo 0011_update_module_type_values fixed for
-- module_type). The unique index is (category, value, tenant_id); Postgres
-- treats NULL <> NULL for uniqueness, so ON CONFLICT does not match a NULL
-- tenant_id row — use a WHERE NOT EXISTS guard instead, matching
-- 0021_seed_visibility_values.
DELETE FROM "enum"
WHERE category = 'task_status'
  AND value = 'To_do';
--> statement-breakpoint
INSERT INTO "enum" (category, value, sort_order, tenant_id)
SELECT 'task_status', 'To do', 1, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM "enum"
  WHERE category = 'task_status' AND value = 'To do' AND tenant_id IS NULL
);
