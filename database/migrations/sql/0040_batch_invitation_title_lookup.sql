-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION find_project_titles_for_invitations(target_project_ids uuid[])
RETURNS TABLE(project_id uuid, title text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, title FROM projects WHERE id = ANY(target_project_ids);
$$;
