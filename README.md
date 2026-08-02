# Overview

A functioning application that several researchers can use concurrently through realistic project, task, daily-note and regulated-record workflows. The MVP must be deployable, testable and suitable for controlled improvement after the initial pilot. It must not require a later architectural rewrite merely to add users, modules, capacity or stronger infrastructure.

## Local Development Setup

### Prerequisites

- Node.js (version pinned in `.nvmrc`) — install via [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm)
- pnpm (version pinned in `package.json`'s `packageManager` field, managed via Corepack)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running, not just installed)

### 1. Clone and enter the repo

```bash
git clone https://github.com/vritika14/ResearchAndTracking.git
cd ResearchAndTracking
```

### 2. Use the correct Node version

```bash
nvm use
```

If you don't have this Node version installed yet:
```bash
nvm install
nvm use
```

### 3. Enable Corepack and activate pnpm

```bash
corepack enable
corepack prepare --activate
```

Verify:
```bash
node -v
pnpm -v
```
These should match the versions in `.nvmrc` and `package.json`.

### 4. Install dependencies

```bash
pnpm install
```

If you see an `ERR_PNPM_IGNORED_BUILDS` warning, run:
```bash
pnpm approve-builds
```
and select the listed packages, then re-run `pnpm install`.

### 5. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your own local values for `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `MINIO_ROOT_USER`, and `MINIO_ROOT_PASSWORD`. These can be anything — they only apply to your own local containers.

### 6. Start PostgreSQL and MinIO

```bash
docker compose up -d
```

Verify both containers are running:
```bash
docker compose ps
```
Both `postgres` and `minio` should show status `Up`.

**Verify PostgreSQL is reachable:**
```bash
docker exec -it your-repo-postgres psql -U <POSTGRES_USER value> -d <POSTGRES_DB value>
```
You should land in a `psql` prompt. Type `\q` to exit.

**Verify MinIO is reachable:**
Open [http://localhost:9001](http://localhost:9001) in a browser and log in with your `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`.

### 7. Run the API

```bash
pnpm dev
```

This starts the NestJS API in watch mode at `http://localhost:3000`. Verify it's running:
```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```
Both should return `200 OK` with a small JSON body. `/health/ready` will return `503` if PostgreSQL or MinIO aren't running.

### 8. Run the web app

```bash
pnpm --filter @research-tracker/web dev
```

This starts the Vite dev server at [http://localhost:5173](http://localhost:5173).

### 9. Useful root-level commands

Run from the repo root, across all workspace packages:

```bash
pnpm lint         # lint all packages
pnpm type-check   # type-check all packages
pnpm test         # run all backend tests
pnpm build        # production build for apps
```

### 10. Stopping local services

```bash
docker compose down
```
This stops the containers but **keeps your data**. To fully reset (delete all local data):
```bash
docker compose down -v
```

### Troubleshooting

- **`ERR_PNPM_IGNORED_BUILDS` during install** — run `pnpm approve-builds`, select the listed packages, then re-run `pnpm install`.
- **`ERR_PNPM_OUTDATED_LOCKFILE`** — someone changed a `package.json` without updating the lockfile. Run `pnpm install` (without `--frozen-lockfile`) to regenerate it, then commit the result.
- **Port already in use (5432, 9000, 9001, 3000, or 5173)** — something else on your machine is using that port. Stop it, or check what's using it with `lsof -i :<port>`.
- **Postgres login fails after changing `.env`** — Postgres only applies `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` on first container creation. If you change these after the fact, run `docker compose down -v` (removes local data) and `docker compose up -d` again to reinitialize.
````
