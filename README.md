# Research & Tracking

Research & Tracking is a pnpm workspace containing the React/Vite web shell and
supporting API, shared packages, database and infrastructure workspaces.

The current frontend establishes the complete local application shell and
approved navigation boundary. Business modules still use placeholder or local
demonstration data.

## Prerequisites

- Node.js `24.18.0` (see `.nvmrc` and `.node-version`)
- pnpm `11.17.0`
- Git

Using a Node version manager is recommended:

```powershell
nvm install 24.18.0
nvm use 24.18.0
corepack enable
corepack prepare pnpm@11.17.0 --activate
```

Confirm the versions:

```powershell
node --version
pnpm --version
```

## Install and run the complete local web shell

From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm dev:web
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173
```

Stop the development server with `Ctrl+C`.

## Quality checks

The same command used by CI runs the frontend typecheck, lint and production
build:

```powershell
pnpm check
```

Individual commands are also available:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

## Approved MVP route map

| Route | Purpose |
| --- | --- |
| `/` | Dashboard shell |
| `/projects` | Projects shell |
| `/projects/:projectId` | Project detail shell |
| `/tasks` | Tasks shell |
| `/daily-notes` | Daily Notes shell |
| `/pipeline` | Research pipeline shell |
| `/settings` | Account settings |
| `/settings/account-audit` | Account audit log |
| `/future/:feature` | Shared placeholder for potential future features |

Calendar, Collaborators, Conferences, CV Builder, Dissemination, Documents,
Funding, HDR students, Journal rankings and research lists, real-time activity,
reviews and HDR examinations, and Teaching currently use the shared future
feature placeholder.

## Frontend structure

```text
apps/web/src/
├── components/
│   ├── layout/       shared desktop sidebar and mobile shell
│   ├── shared/       loading, empty, error, status and table shells
│   ├── typography/   reusable heading standard
│   └── ui/           shadcn-style primitives
├── config/           the single navigation configuration
├── data/             local demonstration data
└── pages/            route-level shells
```

The frontend uses semantic blue design tokens from `src/index.css` and
`tailwind.config.ts`. Both desktop and mobile navigation consume the same
`navGroups` configuration.

## Current scope

The local shell is intended for route, layout, responsive and design-system
validation. Authentication, persistence, authorization and production business
workflows are later delivery items.
