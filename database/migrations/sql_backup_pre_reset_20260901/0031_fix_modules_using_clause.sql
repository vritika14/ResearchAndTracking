-- Comprehensive fix: several policies had WITH CHECK correctly patched
-- earlier today, but their matching USING clause was never updated to
-- match — since INSERT ... RETURNING requires BOTH clauses to pass, this
-- caused "new row violates row-level security policy" even when the
-- WITH CHECK logic was completely correct. This migration brings every
-- USING clause in line with its WITH CHECK counterpart.

-- modules
ALTER POLICY modules_visibility ON modules
  USING (
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

-- module_collaborators
ALTER POLICY module_collaborators_visibility ON module_collaborators
  USING (
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
    OR is_module_collaborator(module_collaborators.module_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

-- project_collaborators
ALTER POLICY project_collaborators_visibility ON project_collaborators
  USING (
    is_project_collaborator(project_collaborators.project_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
        AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );

-- task_members: fix the same circular first-insert problem project_collaborators had
ALTER POLICY task_members_visibility ON task_members
  WITH CHECK (
    is_task_member(task_members.task_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_members.task_id
        AND tasks.created_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );

-- note_members: same fix
ALTER POLICY note_members_visibility ON note_members
  WITH CHECK (
    is_note_member(note_members.note_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_members.note_id
        AND notes.created_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );
  