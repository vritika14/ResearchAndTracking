-- Custom SQL migration file, put your code below! --
ALTER POLICY users_visibility ON users
  WITH CHECK (
    id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR NULLIF(current_setting('app.current_user_id', true), '') IS NULL
  );
  