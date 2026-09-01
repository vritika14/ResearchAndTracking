-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION check_project_collaborator(check_project_id uuid, check_user_id uuid)
RETURNS TABLE(id uuid, role_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, role_id FROM project_collaborators
  WHERE project_id = check_project_id AND user_id = check_user_id;
$$;