-- The display_id unique constraints were global (display_id alone), but
-- display IDs are only meant to be unique WITHIN a tenant (each tenant has
-- its own PRJ/MOD/TSK/NTE counter via tenant_sequences). This caused
-- cross-tenant collisions once multiple tenants generated the same number
-- (e.g. two different tenants both reaching "TSK-0001"). Rescoping the
-- constraint to (tenant_id, display_id) fixes this while preserving the
-- real intent: no two rows in the SAME tenant should share a display_id.

ALTER TABLE projects DROP CONSTRAINT projects_display_id_unique;
ALTER TABLE projects ADD CONSTRAINT projects_tenant_id_display_id_key UNIQUE (tenant_id, display_id);

ALTER TABLE modules DROP CONSTRAINT modules_display_id_unique;
ALTER TABLE modules ADD CONSTRAINT modules_tenant_id_display_id_key UNIQUE (tenant_id, display_id);

ALTER TABLE tasks DROP CONSTRAINT tasks_display_id_unique;
ALTER TABLE tasks ADD CONSTRAINT tasks_tenant_id_display_id_key UNIQUE (tenant_id, display_id);

ALTER TABLE notes DROP CONSTRAINT notes_display_id_unique;
ALTER TABLE notes ADD CONSTRAINT notes_tenant_id_display_id_key UNIQUE (tenant_id, display_id);