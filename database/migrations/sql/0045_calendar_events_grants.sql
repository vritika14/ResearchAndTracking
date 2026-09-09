-- Custom SQL migration file, put your code below! --
-- 0044 created calendar_events but missed the per-table DML grant the
-- runtime role needs (see bootstrap/001_roles.sql — the runtime role gets
-- no table privileges until a migration grants them; same fix as 0039 for
-- analytics_events).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "calendar_events" TO research_tracker_app;
