# ADR-003: Single-Tenant Architecture with Project-Scoped Collaborator Access

## Status

Accepted

## Context

The application supports multiple researchers collaborating on shared work : projects, tasks, daily notes, and regulated research records , across what may eventually be multiple organizations or workspaces. We need an early, durable decision on two related questions, since they shape the database schema (tenant-qualified indexes, Row-Level Security policies), the authorization model, and the API surface from the start of implementation:

1. **Tenancy model** : does each user belong to exactly one workspace, or can workspace membership itself be plural/shared?
2. **Cross-workspace collaboration** :  when a researcher outside a project's owning workspace needs to contribute, how is that access granted and bounded?

The MVP scope (per the approved 13-week delivery plan, 25 July 2026) explicitly requires a "strong multi-tenant and regulated-data baseline without premature microservices," and states the constraint plainly: collaborators must not automatically receive access to the full workspace. Getting this decision wrong early — e.g., defaulting to workspace-wide access for any collaborator — would require retrofitting stricter scoping into the schema and authorization logic later, which is precisely the kind of rework the MVP is designed to avoid.

## Decision

Each user account has exactly one **primary tenant/workspace**. A user may additionally become a **limited member of other workspaces** when explicitly invited to collaborate , this membership is scoped, not equivalent to primary workspace access.

Within a workspace, **projects belong to exactly one tenant**. A project owner may grant **project-scoped collaborator access** (viewer or editor) to specific users , including users whose primary workspace differs from the project's owning tenant. Collaborator access is granted per project via an explicit `project_members` record; it does not confer any visibility into the rest of the owning workspace's projects, tasks, notes, or files.

Enforcement is layered:
- Every backend request checks tenant membership and project-level access explicitly in application code.
- PostgreSQL Row-Level Security (RLS) provides a second, independent enforcement layer at the database level.
- Collaboration/project-membership records are the sole source of truth for access — a collaboration link alone is never sufficient without a corresponding membership record.

Private notes and files carry an additional restriction: visible only to their creator, regardless of project collaboration status.

## Consequences

**This decision enables:**
- Realistic cross-team collaboration (a researcher can contribute to a specific project owned by another workspace) without weakening isolation of the rest of that workspace's data.
- A schema that is tenant-aware and RLS-ready from the start (`tenant_id`, `project_id` on tasks/notes/files; `tenant_memberships` and `project_members` as first-class tables), avoiding a later migration to introduce tenant isolation retroactively.
- A clear, auditable answer to "who can see this record", traceable to an explicit membership row rather than an implicit rule.

**This decision requires, going forward:**
- Every new resource type (tasks, notes, files, and any future module) must carry `tenant_id` and, where scoped, `project_id`, and must be covered by both an application-level access check and an RLS policy — this is not optional per-feature; it is the baseline enforcement pattern for the whole system.
- `tests/isolation/` must specifically cover: a user cannot access another tenant's data without an explicit `project_members` grant; a project collaborator cannot see other projects within the owning tenant; private notes/files remain hidden from project collaborators who are not the creator.
- Any future move toward broader multi-workspace features (e.g., a "portfolio" view spanning several tenants a user belongs to) must be treated as a new decision, not an incremental extension of this one, since it changes the isolation guarantees this ADR establishes.

**This decision explicitly defers:**
- Arbitrary named-person ACLs at a finer grain than project membership.
- A second workspace type or multi-workspace portfolio management (noted as deferred in the approved MVP scope).
- Enterprise identity federation (SAML/SCIM) affecting how tenant membership is provisioned.