-- Enable Row-Level Security and define visibility policies for tenant-scoped tables.
-- Relies on two session variables, set per-request by the API's TenantContextMiddleware:
--   app.current_tenant_id  -- the workspace the request is scoped to
--   app.current_user_id    -- the authenticated user making the request
-- Both are read via current_setting(..., true) so a missing/unset value returns NULL
-- rather than raising an error, which means "show nothing" by default (safe failure).

-- ============================================================
-- projects
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_visibility ON projects
  USING (
    user_id = current_setting('app.current_user_id', true)::uuid
    OR EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = projects.id
        AND project_collaborators.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- ============================================================
-- modules
-- inherits visibility from its parent project (if it has one);
-- standalone modules fall back to their own collaborator list
-- ============================================================
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY modules_visibility ON modules
  USING (
    (
      project_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM projects WHERE projects.id = modules.project_id)
    )
    OR EXISTS (
      SELECT 1 FROM module_collaborators
      WHERE module_collaborators.module_id = modules.id
        AND module_collaborators.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- ============================================================
-- tasks
-- never inherits from project/module; creator or explicit member only
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_visibility ON tasks
  USING (
    created_by = current_setting('app.current_user_id', true)::uuid
    OR EXISTS (
      SELECT 1 FROM task_members
      WHERE task_members.task_id = tasks.id
        AND task_members.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- ============================================================
-- notes
-- same pattern as tasks
-- ============================================================
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_visibility ON notes
  USING (
    created_by = current_setting('app.current_user_id', true)::uuid
    OR EXISTS (
      SELECT 1 FROM note_members
      WHERE note_members.note_id = notes.id
        AND note_members.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- ============================================================
-- project_collaborators
-- visible to anyone who is themselves a collaborator on that same project
-- ============================================================
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_collaborators_visibility ON project_collaborators
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc2
      WHERE pc2.project_id = project_collaborators.project_id
        AND pc2.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- ============================================================
-- module_collaborators
-- ============================================================
ALTER TABLE module_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY module_collaborators_visibility ON module_collaborators
  USING (
    EXISTS (
      SELECT 1 FROM module_collaborators mc2
      WHERE mc2.module_id = module_collaborators.module_id
        AND mc2.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- ============================================================
-- task_members
-- ============================================================
ALTER TABLE task_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_members_visibility ON task_members
  USING (
    EXISTS (
      SELECT 1 FROM task_members tm2
      WHERE tm2.task_id = task_members.task_id
        AND tm2.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- ============================================================
-- note_members
-- ============================================================
ALTER TABLE note_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY note_members_visibility ON note_members
  USING (
    EXISTS (
      SELECT 1 FROM note_members nm2
      WHERE nm2.note_id = note_members.note_id
        AND nm2.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );
  