# Why this folder is empty

This module's table definitions (`tenant_memberships`, `invitations`) are **not**
duplicated here. They live in `@research-tracker/migrations`
(`database/migrations/src/schema/`), which is the single source of truth for
every table's shape.

## Why

We use Drizzle ORM with a dedicated workspace package for schema, specifically so
that `drizzle-kit generate` can read table definitions directly and produce
migrations from them. If a table's shape were also re-declared here, the two
copies would have no mechanism keeping them in sync — a column added via a
migration wouldn't automatically update a duplicate entity file, and the drift
would only surface at runtime (a query silently ignoring a real column, or
failing against a table it doesn't expect), not at compile time.

## Where the real integration point is instead

`../repositories/` imports table definitions directly from
`@research-tracker/migrations` and uses them in Drizzle queries. That's the
actual "this module talks to this table" boundary — an `entities/` folder here
would just be a second, unreliable copy of information that already exists.

This folder is kept (rather than omitted) so the module's structure still
matches the project's documented per-module convention, and so this explanation
is visible to anyone expecting entity files here.