-- Fixes a real bug affecting every RLS policy and helper function:
-- current_setting(..., true) returns an empty string ('') when the setting
-- was never configured on this connection, not NULL. Casting ''::uuid
-- fails with "invalid input syntax for type uuid" instead of safely
-- evaluating to NULL (which every policy correctly treats as "no match").
-- NULLIF(x, '') converts the empty string to a genuine NULL before the
-- cast, so unset context is handled safely everywhere.

-- ============================================================
-- Helper functions
-- ============================================================
CREATE OR REPLACE FUNCTION is_project_collaborator(check_project_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE project_id = check_project_id AND user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION is_module_collaborator(check_module_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM module_collaborators
    WHERE module_id = check_module_id AND user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION is_task_member(check_task_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM task_members
    WHERE task_id = check_task_id AND user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION is_note_member(check_note_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM note_members
    WHERE note_id = check_note_id AND user_id = check_user_id
  );
$$;

-- Note: the four functions above don't cast inside themselves — the fix
-- belongs where current_setting(...) is actually cast, in the policies below.

-- ============================================================
-- projects
-- ============================================================
ALTER POLICY projects_visibility ON projects
  USING (
    user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR is_project_collaborator(projects.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER POLICY projects_visibility ON projects
  WITH CHECK (
    user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR is_project_collaborator(projects.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

-- ============================================================
-- modules
-- ============================================================
ALTER POLICY modules_visibility ON modules
  USING (
    (
      project_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM projects WHERE projects.id = modules.project_id)
    )
    OR is_module_collaborator(modules.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER POLICY modules_visibility ON modules
  WITH CHECK (
    (
      project_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM projects WHERE projects.id = modules.project_id)
    )
    OR is_module_collaborator(modules.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

-- ============================================================
-- tasks
-- ============================================================
ALTER POLICY tasks_visibility ON tasks
  USING (
    created_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR is_task_member(tasks.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER POLICY tasks_visibility ON tasks
  WITH CHECK (
    created_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR is_task_member(tasks.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

-- ============================================================
-- notes
-- ============================================================
ALTER POLICY notes_visibility ON notes
  USING (
    created_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR is_note_member(notes.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER POLICY notes_visibility ON notes
  WITH CHECK (
    created_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR is_note_member(notes.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

-- ============================================================
-- project_collaborators
-- ============================================================
ALTER POLICY project_collaborators_visibility ON project_collaborators
  USING (
    is_project_collaborator(project_collaborators.project_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER POLICY project_collaborators_visibility ON project_collaborators
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
        AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );

-- ============================================================
-- module_collaborators
-- ============================================================
ALTER POLICY module_collaborators_visibility ON module_collaborators
  USING (
    is_module_collaborator(module_collaborators.module_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER POLICY module_collaborators_visibility ON module_collaborators
  WITH CHECK (
    is_module_collaborator(module_collaborators.module_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

-- ============================================================
-- task_members
-- ============================================================
ALTER POLICY task_members_visibility ON task_members
  USING (
    is_task_member(task_members.task_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER POLICY task_members_visibility ON task_members
  WITH CHECK (
    is_task_member(task_members.task_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

-- ============================================================
-- note_members
-- ============================================================
ALTER POLICY note_members_visibility ON note_members
  USING (
    is_note_member(note_members.note_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER POLICY note_members_visibility ON note_members
  WITH CHECK (
    is_note_member(note_members.note_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );
  