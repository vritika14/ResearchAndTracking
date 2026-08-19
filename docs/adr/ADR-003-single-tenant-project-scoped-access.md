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

## Implementation notes (as of 19 August 2026)

Projects, modules, tasks, and notes are now implemented against this decision. A few points in the
original text describe the intended shape more precisely than what shipped, or predate details
that only became concrete during implementation. Recorded here rather than edited into the
Decision above, so the original reasoning stays intact:

- **RLS is not yet implemented.** The "layered enforcement" described above assumed both an
  application-level check and an independent PostgreSQL RLS policy per resource. Only the
  application-level check exists today — every list/read/update/delete path is gated by an explicit
  `canAccess()` check in its service, but there is no RLS policy backing it up. This was a deliberate
  scope cut for the current phase (reworking the DB connection layer to support request-scoped
  `SET LOCAL` session context carries real risk of breaking every existing query), tracked as
  follow-up work, not an oversight.
- **Collaborator roles are labels, not permission tiers.** The role vocabulary that shipped is
  `Owner | Collaborator | Supervisor | Lead` (project/module) — not the "viewer or editor" framing
  in the Decision. Access is currently presence-only: any collaborator row grants full read/write
  access regardless of which of these four values it holds. Differentiated read-vs-write permissions
  per role are not implemented.
- **Table naming differs from the ADR text.** The Decision refers to a `project_members` table;
  the implemented schema uses `project_collaborators` for projects, plus the equivalent
  `module_collaborators`, `task_members`, and `note_members` for the other resource types (modules
  follow the same collaborator-role shape as projects; tasks/notes use a simpler flat membership
  with no role field, since their access model doesn't distinguish roles at all — see below).
- **Cross-tenant collaborator assignment is possible at the API but not reachable from the UI.**
  Nothing in `ProjectCollaboratorsService.add()` (or the module equivalent) requires the invited
  `userId` to be a member of the owning tenant, so the API does support the ADR's "collaborator
  whose primary workspace differs from the project's owning tenant" case. The current frontend
  collaborator picker only searches members of the caller's own workspace (`useMembers(tenantId)`),
  so there is no way to actually invite a cross-tenant collaborator through the app yet.
- **Modules extend this model, not covered in the original Decision.** A module scoped to a project
  (`projectId` set) inherits that project's collaborator list — anyone who can see the project can
  see the module. An independent module (no `projectId`) is visible only to its own
  `module_collaborators`, mirroring project-level access one level down. The module creator is
  auto-inserted as an "Owner" collaborator on independent-module creation, matching how project
  creation auto-inserts the owner.
- **Task/note visibility is stricter than "private... regardless of collaboration status" implies.**
  That phrasing reads as if non-private (shared) tasks/notes inherit visibility from project
  collaboration. They don't, by design: a task or note is visible only to its creator or to users
  explicitly added to that task's/note's own member list (`task_members` / `note_members`) — being
  a collaborator on the surrounding project never grants access on its own, for private *or* shared
  items. "Private" vs "Shared" is a `visibility` field the creator sets; marking something "Shared"
  only makes it *possible* to add other members to its member list (and auto-clears that list if
  switched back to "Private") — it does not by itself grant anyone access.
- **Files do not exist as a resource type yet.** The Decision's repeated "tasks, notes, and files"
  phrasing describes target scope; no files/attachments module has been built. Whenever it is, it
  should follow the same `tenant_id` + explicit-membership pattern as the other resource types.
- **`tests/isolation/` is still a placeholder.** The directory exists (`tests/isolation/package.json`)
  but contains no tests yet. The isolation coverage that does exist today — access-denial cases for
  cross-tenant reads, non-collaborators, non-members — lives inline in each module's own Jest spec
  file (e.g. `apps/api/src/modules/tasks/services/tasks.service.spec.ts`) rather than in a
  consolidated `tests/isolation/` suite. Consolidating that coverage into `tests/isolation/` as
  originally described remains open.