-- Custom SQL migration file, put your code below! --
ALTER POLICY users_visibility ON users
  USING (
    id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR shares_project_with(NULLIF(current_setting('app.current_user_id', true), '')::uuid, id)
    OR shares_module_with(NULLIF(current_setting('app.current_user_id', true), '')::uuid, id)
    OR shares_task_with(NULLIF(current_setting('app.current_user_id', true), '')::uuid, id)
    OR shares_note_with(NULLIF(current_setting('app.current_user_id', true), '')::uuid, id)
    OR NULLIF(current_setting('app.current_user_id', true), '') IS NULL
  );