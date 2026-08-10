# Why this folder is empty

This module's table definitions (`tenants`) are **not** duplicated here.
They live in `@research-tracker/migrations`
(`database/migrations/src/schema/`), which is the single source of truth
for every table's shape.

See `../../memberships/entities/README.md` for the full explanation —
the same reasoning applies here.