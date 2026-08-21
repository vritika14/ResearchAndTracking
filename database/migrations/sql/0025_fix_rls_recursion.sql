-- Fixes infinite recursion in RLS policies that check membership by querying
-- the same table they're protecting. SECURITY DEFINER functions bypass RLS
-- for just the internal membership check, breaking the recursive loop.

-- ============================================================
-- project_collaborators
-- ============================================================
DROP POLICY IF EXISTS project_collaborators_visibility ON project_collaborators;

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

CREATE POLICY project_collaborators_visibility ON project_collaborators
  USING (
    is_project_collaborator(project_collaborators.project_id, current_setting('app.current_user_id', true)::uuid)
  );

-- ============================================================
-- module_collaborators
-- ============================================================
DROP POLICY IF EXISTS module_collaborators_visibility ON module_collaborators;

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

CREATE POLICY module_collaborators_visibility ON module_collaborators
  USING (
    is_module_collaborator(module_collaborators.module_id, current_setting('app.current_user_id', true)::uuid)
  );

-- ============================================================
-- task_members
-- ============================================================
DROP POLICY IF EXISTS task_members_visibility ON task_members;

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

CREATE POLICY task_members_visibility ON task_members
  USING (
    is_task_member(task_members.task_id, current_setting('app.current_user_id', true)::uuid)
  );

-- ============================================================
-- note_members
-- ============================================================
DROP POLICY IF EXISTS note_members_visibility ON note_members;

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

CREATE POLICY note_members_visibility ON note_members
  USING (
    is_note_member(note_members.note_id, current_setting('app.current_user_id', true)::uuid)
  );

-- ============================================================
-- projects — also update to use the new helper function,
-- for consistency and to avoid the same class of recursion risk
-- ============================================================
DROP POLICY IF EXISTS projects_visibility ON projects;

CREATE POLICY projects_visibility ON projects
  USING (
    user_id = current_setting('app.current_user_id', true)::uuid
    OR is_project_collaborator(projects.id, current_setting('app.current_user_id', true)::uuid)
  );

-- ============================================================
-- modules — also update to use the new helper functions
-- ============================================================
DROP POLICY IF EXISTS modules_visibility ON modules;

CREATE POLICY modules_visibility ON modules
  USING (
    (
      project_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM projects WHERE projects.id = modules.project_id)
    )
    OR is_module_collaborator(modules.id, current_setting('app.current_user_id', true)::uuid)
  );

-- ============================================================
-- tasks — also update to use the new helper function
-- ============================================================
DROP POLICY IF EXISTS tasks_visibility ON tasks;

CREATE POLICY tasks_visibility ON tasks
  USING (
    created_by = current_setting('app.current_user_id', true)::uuid
    OR is_task_member(tasks.id, current_setting('app.current_user_id', true)::uuid)
  );

-- ============================================================
-- notes — also update to use the new helper function
-- ============================================================
DROP POLICY IF EXISTS notes_visibility ON notes;

CREATE POLICY notes_visibility ON notes
  USING (
    created_by = current_setting('app.current_user_id', true)::uuid
    OR is_note_member(notes.id, current_setting('app.current_user_id', true)::uuid)
  );
  