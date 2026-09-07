-- Custom SQL migration file, put your code below! --
-- 0037/0038 created analytics_events and its RLS policy but missed the
-- per-table DML grant the runtime role needs (see bootstrap/001_roles.sql —
-- the runtime role gets no table privileges until a migration grants them).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "analytics_events" TO research_tracker_app;