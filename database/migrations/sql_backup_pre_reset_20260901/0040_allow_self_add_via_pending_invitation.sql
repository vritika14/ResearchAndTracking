-- project_collaborators' WITH CHECK only allowed the project owner to
-- insert a new collaborator row. Accepting an invitation means the
-- INVITEE inserts themselves, which the owner-only check correctly
-- rejects. This adds a second, legitimate path: a user may insert
-- themselves as a collaborator if there's a matching, still-pending
-- invitation for their own email on that exact project. "pending" (not
-- "accepted") is checked because ProjectInvitationsService.accept()
-- creates the collaborator row BEFORE marking the invitation accepted.

ALTER POLICY project_collaborators_visibility ON project_collaborators
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
        AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
    OR (
      user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
      AND EXISTS (
        SELECT 1 FROM project_invitations
        WHERE project_invitations.project_id = project_collaborators.project_id
          AND project_invitations.status = 'pending'
          AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
              AND lower(users.email) = lower(project_invitations.email)
          )
      )
    )
  );