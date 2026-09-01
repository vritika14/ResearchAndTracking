-- preview/accept-by-token need to look up an invitation before the caller
-- is necessarily authenticated (preview is explicitly unauthenticated) or
-- before app.current_user_id matches anything the RLS policy checks
-- (the invitee may not be logged in as themselves yet at preview time).
-- The token itself (long, cryptographically random, single-use, hashed)
-- is the real security boundary here, not RLS — so these SECURITY DEFINER
-- functions deliberately bypass RLS for a token-based lookup only.

CREATE OR REPLACE FUNCTION find_project_invitation_by_token(token_hash text)
RETURNS project_invitations
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM project_invitations WHERE token = token_hash;
$$;

CREATE OR REPLACE FUNCTION find_module_invitation_by_token(token_hash text)
RETURNS module_invitations
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM module_invitations WHERE token = token_hash;
$$;