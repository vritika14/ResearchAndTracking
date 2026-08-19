-- The runtime role (research_tracker_app) was never granted DML rights on
-- these tables — per bootstrap/001_roles.sql, grants are meant to happen
-- per-table inside the migration that creates each table, but the
-- migrations that created these particular tables omitted it. Every
-- request touching projects/modules/tasks/notes was failing with
-- "permission denied for table ..." because of this.
GRANT SELECT, INSERT, UPDATE, DELETE ON "enum" TO research_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "tenant_sequences" TO research_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "projects" TO research_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "project_collaborators" TO research_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "modules" TO research_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "module_collaborators" TO research_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "tasks" TO research_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "notes" TO research_tracker_app;
