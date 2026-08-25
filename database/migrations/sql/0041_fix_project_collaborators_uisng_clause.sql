-- Same class of bug we've hit repeatedly today: 0032 added the invitation-
-- based path to project_collaborators' WITH CHECK, but INSERT ... RETURNING
-- also requires the USING clause to pass for the new row to be returned —
-- and USING was never updated to match. This adds the same invitation path
-- to USING.

ALTER POLICY project_collaborators_visibility ON project_collaborators
  USING (
    is_project_collaborator(project_collaborators.project_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR EXISTS (
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