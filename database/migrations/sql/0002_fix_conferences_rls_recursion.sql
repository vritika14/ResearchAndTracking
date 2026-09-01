-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION is_conference_project_collaborator(check_conference_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conference_projects
    JOIN project_collaborators
      ON project_collaborators.project_id = conference_projects.project_id
    WHERE conference_projects.conference_id = check_conference_id
      AND project_collaborators.user_id = check_user_id
  );
$$;
--> statement-breakpoint
ALTER POLICY conferences_visibility ON conferences
  USING (
    owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR is_conference_project_collaborator(id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );