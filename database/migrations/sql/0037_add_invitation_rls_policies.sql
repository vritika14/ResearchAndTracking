-- RLS policies for project_invitations and module_invitations.
-- Visibility: the inviter can see invitations they sent; a logged-in user
-- can see any invitation addressed to their own email, so GET /api/v1/me/invitations
-- can work by matching the invitation's email column against the caller's
-- own users.email. Creation: only the project owner (or, for modules, the
-- same owner logic used elsewhere — project owner/collaborator for a
-- project-scoped module, tenant owner for a standalone one) may invite.

-- ============================================================
-- project_invitations
-- ============================================================
CREATE POLICY project_invitations_visibility ON project_invitations
  USING (
    invited_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR email = (
      SELECT email FROM users
      WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );
ALTER POLICY project_invitations_visibility ON project_invitations
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_invitations.project_id
        AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );

-- ============================================================
-- module_invitations
-- ============================================================
CREATE POLICY module_invitations_visibility ON module_invitations
  USING (
    invited_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR email = (
      SELECT email FROM users
      WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );

ALTER POLICY module_invitations_visibility ON module_invitations
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = module_invitations.module_id
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
