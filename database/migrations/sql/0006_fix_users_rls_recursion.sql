-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION shares_project_with(check_user_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_collaborators pc1
    JOIN project_collaborators pc2 ON pc2.project_id = pc1.project_id
    WHERE pc1.user_id = check_user_id
      AND pc2.user_id = target_user_id
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION shares_module_with(check_user_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM module_collaborators mc1
    JOIN module_collaborators mc2 ON mc2.module_id = mc1.module_id
    WHERE mc1.user_id = check_user_id
      AND mc2.user_id = target_user_id
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION shares_task_with(check_user_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM task_members tm1
    JOIN task_members tm2 ON tm2.task_id = tm1.task_id
    WHERE tm1.user_id = check_user_id
      AND tm2.user_id = target_user_id
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION shares_note_with(check_user_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM note_members nm1
    JOIN note_members nm2 ON nm2.note_id = nm1.note_id
    WHERE nm1.user_id = check_user_id
      AND nm2.user_id = target_user_id
  );
$$;
--> statement-breakpoint
ALTER POLICY users_visibility ON users
  USING (
    id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR shares_project_with(NULLIF(current_setting('app.current_user_id', true), '')::uuid, id)
    OR shares_module_with(NULLIF(current_setting('app.current_user_id', true), '')::uuid, id)
    OR shares_task_with(NULLIF(current_setting('app.current_user_id', true), '')::uuid, id)
    OR shares_note_with(NULLIF(current_setting('app.current_user_id', true), '')::uuid, id)
  );