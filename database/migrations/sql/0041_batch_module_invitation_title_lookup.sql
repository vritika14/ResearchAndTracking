-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION find_module_titles_for_invitations(target_module_ids uuid[])
RETURNS TABLE(module_id uuid, title text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, title FROM modules WHERE id = ANY(target_module_ids);
$$;