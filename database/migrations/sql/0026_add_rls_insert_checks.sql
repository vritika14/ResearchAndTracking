-- Adds WITH CHECK clauses to every RLS policy that allows inserts.
-- USING alone only governs which existing rows can be read/updated/deleted;
-- INSERT requires a separate WITH CHECK clause, or Postgres blocks every
-- new row by default (which was the actual cause of "new row violates
-- row-level security policy" when creating a project).

ALTER POLICY projects_visibility ON projects
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)::uuid
    OR is_project_collaborator(projects.id, current_setting('app.current_user_id', true)::uuid)
  );

ALTER POLICY modules_visibility ON modules
  WITH CHECK (
    (
      project_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM projects WHERE projects.id = modules.project_id)
    )
    OR is_module_collaborator(modules.id, current_setting('app.current_user_id', true)::uuid)
  );

ALTER POLICY tasks_visibility ON tasks
  WITH CHECK (
    created_by = current_setting('app.current_user_id', true)::uuid
    OR is_task_member(tasks.id, current_setting('app.current_user_id', true)::uuid)
  );

ALTER POLICY notes_visibility ON notes
  WITH CHECK (
    created_by = current_setting('app.current_user_id', true)::uuid
    OR is_note_member(notes.id, current_setting('app.current_user_id', true)::uuid)
  );

ALTER POLICY project_collaborators_visibility ON project_collaborators
  WITH CHECK (
    is_project_collaborator(project_collaborators.project_id, current_setting('app.current_user_id', true)::uuid)
  );

ALTER POLICY module_collaborators_visibility ON module_collaborators
  WITH CHECK (
    is_module_collaborator(module_collaborators.module_id, current_setting('app.current_user_id', true)::uuid)
  );

ALTER POLICY task_members_visibility ON task_members
  WITH CHECK (
    is_task_member(task_members.task_id, current_setting('app.current_user_id', true)::uuid)
  );

ALTER POLICY note_members_visibility ON note_members
  WITH CHECK (
    is_note_member(note_members.note_id, current_setting('app.current_user_id', true)::uuid)
  );
  