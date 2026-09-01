-- Fixes a circular check in project_collaborators' WITH CHECK clause:
-- the original check required the inserting user to already be a
-- collaborator on the project, which is impossible for the very first
-- collaborator row (the owner) created right after project creation.
-- The correct check is: the current user owns the project this
-- collaborator row belongs to (covers both initial owner-insert and
-- an owner adding someone else as a collaborator later).

ALTER POLICY project_collaborators_visibility ON project_collaborators
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
        AND projects.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );
  