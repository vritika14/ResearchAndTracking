-- Custom SQL migration file, put your code below! --
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY users_visibility ON users
  USING (
    id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR EXISTS (
      SELECT 1 FROM project_collaborators pc1
      JOIN project_collaborators pc2 ON pc2.project_id = pc1.project_id
      WHERE pc1.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND pc2.user_id = users.id
    )
    OR EXISTS (
      SELECT 1 FROM module_collaborators mc1
      JOIN module_collaborators mc2 ON mc2.module_id = mc1.module_id
      WHERE mc1.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND mc2.user_id = users.id
    )
    OR EXISTS (
      SELECT 1 FROM task_members tm1
      JOIN task_members tm2 ON tm2.task_id = tm1.task_id
      WHERE tm1.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND tm2.user_id = users.id
    )
    OR EXISTS (
      SELECT 1 FROM note_members nm1
      JOIN note_members nm2 ON nm2.note_id = nm1.note_id
      WHERE nm1.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND nm2.user_id = users.id
    )
  )
  WITH CHECK (
    id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );
  