-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION check_module_collaborator(check_module_id uuid, check_user_id uuid)
RETURNS TABLE(id uuid, role_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, role_id FROM module_collaborators
  WHERE module_id = check_module_id AND user_id = check_user_id;
$$;