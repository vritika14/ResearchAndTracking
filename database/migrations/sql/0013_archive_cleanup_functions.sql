-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION cleanup_archived_projects(cutoff_date timestamptz)
RETURNS TABLE(id uuid, title text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM projects
  WHERE archived_at IS NOT NULL AND archived_at < cutoff_date
  RETURNING id, title;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cleanup_archived_modules(cutoff_date timestamptz)
RETURNS TABLE(id uuid, title text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM modules
  WHERE archived_at IS NOT NULL AND archived_at < cutoff_date
  RETURNING id, title;
$$;