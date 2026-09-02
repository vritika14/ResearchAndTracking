-- Older module creation attempted to add module-scoped pipeline stages before
-- inserting the Owner collaborator. RLS rejected the stage insert and some
-- historical requests left a module without an owner. Repair those rows using
-- the parent project owner, or the workspace owner for independent modules.
INSERT INTO module_collaborators (
  tenant_id,
  project_id,
  module_id,
  user_id,
  role_id
)
SELECT
  modules.tenant_id,
  modules.project_id,
  modules.id,
  COALESCE(projects.user_id, tenants.owner_user_id),
  owner_role.id
FROM modules
JOIN tenants ON tenants.id = modules.tenant_id
LEFT JOIN projects ON projects.id = modules.project_id
CROSS JOIN LATERAL (
  SELECT id
  FROM "enum"
  WHERE category = 'project_role'
    AND value = 'Owner'
    AND tenant_id IS NULL
    AND project_id IS NULL
    AND module_id IS NULL
  LIMIT 1
) owner_role
WHERE NOT EXISTS (
  SELECT 1
  FROM module_collaborators existing_owner
  JOIN "enum" existing_role ON existing_role.id = existing_owner.role_id
  WHERE existing_owner.module_id = modules.id
    AND existing_role.category = 'project_role'
    AND existing_role.value = 'Owner'
)
ON CONFLICT (module_id, user_id)
DO UPDATE SET
  role_id = EXCLUDED.role_id,
  updated_at = now();
