-- Accepting an invitation needs to read the invited project's tenant_id
-- to create the new collaborator row — but the invitee isn't a collaborator
-- yet (that's what accept() is in the middle of creating), so normal RLS
-- correctly hides the project from them at this exact moment. The already-
-- validated invitation (pending, unexpired, matching the caller's own
-- email) is the real authorization here, so this lookup deliberately
-- bypasses RLS via SECURITY DEFINER, scoped to exactly this one read.

CREATE OR REPLACE FUNCTION find_project_by_id_for_invitation(target_project_id uuid)
RETURNS projects
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM projects WHERE id = target_project_id;
$$;