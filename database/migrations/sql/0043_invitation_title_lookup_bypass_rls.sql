-- Preview and "my pending invitations" need to show the project/module
-- title, but at that point the caller may not have access to the
-- project/module yet (that's the whole point of the invitation), so
-- normal RLS correctly hides it. The invitation's own existence (a valid
-- token, or a matching email on a pending invitation) is the real
-- authorization for seeing just the title — these SECURITY DEFINER
-- functions provide that narrow bypass.

CREATE OR REPLACE FUNCTION find_project_title_for_invitation(target_project_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT title FROM projects WHERE id = target_project_id;
$$;

CREATE OR REPLACE FUNCTION find_module_title_for_invitation(target_module_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT title FROM modules WHERE id = target_module_id;
$$;
