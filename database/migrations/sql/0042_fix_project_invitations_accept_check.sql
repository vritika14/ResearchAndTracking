-- project_invitations' WITH CHECK only allowed the project owner to write
-- (needed for creating invitations). Accepting an invitation updates the
-- SAME row's status to 'accepted', done by the INVITEE, not the owner —
-- so this needs its own legitimate path: the invitee may update an
-- invitation addressed to their own email.

ALTER POLICY project_invitations_visibility ON project_invitations
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_invitations.project_id
        AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND lower(users.email) = lower(project_invitations.email)
    )
  );
