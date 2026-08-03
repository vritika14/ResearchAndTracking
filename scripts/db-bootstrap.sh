#!/usr/bin/env bash
set -euo pipefail

# Bootstraps migration and runtime Postgres roles.
# Requires the following environment variables to be set:
#   POSTGRES_DB
#   POSTGRES_USER, POSTGRES_PASSWORD          (superuser/master credentials)
#   POSTGRES_MIGRATION_USER, POSTGRES_MIGRATION_PASSWORD
#   POSTGRES_RUNTIME_USER, POSTGRES_RUNTIME_PASSWORD

CONTAINER_NAME="your-repo-postgres"
SQL_FILE="database/migrations/bootstrap/001_roles.sql"
CONTAINER_SQL_PATH="/tmp/001_roles.sql"

docker cp "$SQL_FILE" "$CONTAINER_NAME:$CONTAINER_SQL_PATH"

docker exec "$CONTAINER_NAME" psql \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -v migration_role="$POSTGRES_MIGRATION_USER" \
  -v migration_password="$POSTGRES_MIGRATION_PASSWORD" \
  -v runtime_role="$POSTGRES_RUNTIME_USER" \
  -v runtime_password="$POSTGRES_RUNTIME_PASSWORD" \
  -v dbname="$POSTGRES_DB" \
  -f "$CONTAINER_SQL_PATH"

docker exec "$CONTAINER_NAME" rm "$CONTAINER_SQL_PATH"

echo "Roles bootstrapped successfully."