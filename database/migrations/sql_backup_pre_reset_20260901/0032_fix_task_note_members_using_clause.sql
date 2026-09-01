ALTER POLICY task_members_visibility ON task_members
  USING (
    is_task_member(task_members.task_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_members.task_id
        AND tasks.created_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );

ALTER POLICY note_members_visibility ON note_members
  USING (
    is_note_member(note_members.note_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_members.note_id
        AND notes.created_by = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );