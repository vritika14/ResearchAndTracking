-- Migration 0034 disabled RLS because TenantContextMiddleware wasn't
-- actually wiring session context through to real queries — confirmed at
-- the time via live request tracing. That root cause has since been fixed:
-- DrizzleService.db is now a getter that returns the request-scoped
-- transaction (via AsyncLocalStorage) instead of the plain pooled
-- connection, so every repository query genuinely runs inside the same
-- transaction the middleware set app.current_user_id/app.current_tenant_id
-- on. This has been directly verified by matching pg_backend_pid() across
-- the middleware and repository layers, and by confirming RLS actually
-- blocks/allows access correctly end-to-end through the real API.
-- Re-enabling RLS now that its actual dependency is fixed.

ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_collaborators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "module_collaborators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_members" ENABLE ROW LEVEL SECURITY;
