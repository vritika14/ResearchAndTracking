-- Fixes the same circular-check bug we found in project_collaborators,
-- now found in module_collaborators: the original WITH CHECK required
-- the inserting user to already be a module collaborator, which is
-- impossible for the very first collaborator row (added right after
-- module creation). The correct check mirrors modules_visibility itself:
-- allow insert if the user can access the module's parent project
-- (project owner or project collaborator), or — for a standalone module —
-- if they own the tenant.

ALTER POLICY module_collaborators_visibility ON module_collaborators
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = module_collaborators.module_id
        AND (
          (
            modules.project_id IS NOT NULL
            AND (
              EXISTS (
                SELECT 1 FROM projects
                WHERE projects.id = modules.project_id
                  AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
              )
              OR is_project_collaborator(modules.project_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
            )
          )
          OR (
            modules.project_id IS NULL
            AND EXISTS (
              SELECT 1 FROM tenants
              WHERE tenants.id = modules.tenant_id
                AND tenants.owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
          )
        )
    )
  );
  