-- Fixes the "new row violates row-level security policy for table modules"
-- error when creating a standalone module (no project). The original
-- WITH CHECK had no valid path for a brand-new, project-less module: the
-- project_id branch doesn't apply, and the module_collaborators branch is
-- circular (checking membership on a module that doesn't exist yet).
-- Per confirmed rule: only the workspace owner may create standalone modules.

ALTER POLICY modules_visibility ON modules
  WITH CHECK (
    (
      project_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM projects WHERE projects.id = modules.project_id)
    )
    OR (
      project_id IS NULL
      AND EXISTS (
        SELECT 1 FROM tenants
        WHERE tenants.id = modules.tenant_id
          AND tenants.owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
      )
    )
    OR is_module_collaborator(modules.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );
  