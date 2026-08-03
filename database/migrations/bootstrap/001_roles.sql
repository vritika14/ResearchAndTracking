-- Idempotent role bootstrap. Safe to run repeatedly against any environment.
-- Run once per database cluster, using a superuser (local Docker POSTGRES_USER,
-- or the RDS master user in staging/production) — never by the application itself.

SELECT format('CREATE ROLE %I WITH LOGIN PASSWORD %L', :'migration_role', :'migration_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'migration_role')
\gexec

SELECT format('CREATE ROLE %I WITH LOGIN PASSWORD %L', :'runtime_role', :'runtime_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'runtime_role')
\gexec

-- Migration role: owns the schema, can run DDL.
GRANT ALL PRIVILEGES ON SCHEMA public TO :"migration_role";

-- Runtime role: no DDL rights, connect-only for now — DML grants happen
-- per-table inside migration files once each table exists.
GRANT CONNECT ON DATABASE :"dbname" TO :"runtime_role";
GRANT USAGE ON SCHEMA public TO :"runtime_role";