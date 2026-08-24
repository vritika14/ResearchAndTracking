# Accessing the Dev PostgreSQL Database from macOS

This assumes the RDS instance already exists (see [dev-database-rds-setup.md](dev-database-rds-setup.md) for how it was created — that doc's steps 1-2 and 9 are platform-independent; this one replaces its Windows-specific steps 3-8 with macOS equivalents).

**Instance:** `research-tracker-dev-db` in `ap-southeast-2`
**Endpoint:** `research-tracker-dev-db.chqecwsweits.ap-southeast-2.rds.amazonaws.com`
**Database:** `researchtracker`

---

## 1. Install the AWS CLI (if not already installed)

```bash
brew install awscli
aws --version
```

Configure the same profile used on the rest of the team's machines:

```bash
aws configure sso --profile research-dev
```

Follow the prompts (SSO start URL, region `ap-southeast-2`) — ask whoever administers the AWS account for the SSO start URL if you don't have it. Once set up, authenticate:

```bash
aws sso login --profile research-dev
aws sts get-caller-identity --profile research-dev
```

## 2. Allow this Mac's IP through the security group

RDS only accepts connections from IPs explicitly allowed in its security group. Your Mac's public IP needs its own rule — it's different from anyone else's.

```bash
MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "$MY_IP"

SG_ID=$(aws rds describe-db-instances \
  --db-instance-identifier research-tracker-dev-db \
  --profile research-dev --region ap-southeast-2 \
  --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text)

aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 5432 \
  --cidr "${MY_IP}/32" \
  --profile research-dev --region ap-southeast-2
```

If your CLI user doesn't have `rds:DescribeDBInstances`/`ec2:AuthorizeSecurityGroupIngress` permission, ask an admin to add the rule instead — give them your `$MY_IP` value. Never use `0.0.0.0/0`. If your IP changes (new network, café wifi, VPN), re-run this.

## 3. Install a PostgreSQL client

Don't install the full `postgresql` formula if you don't want a local server — `libpq` gives you just `psql` and the client libraries:

```bash
brew install libpq
echo 'export PATH="'"$(brew --prefix libpq)"'/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
psql --version
```

(If you're on bash instead of zsh, append to `~/.bash_profile` instead.)

## 4. Download the RDS CA certificate bundle

```bash
mkdir -p ~/.aws
curl -o ~/.aws/rds-global-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

## 5. Connect with `psql`

Set convenient variables for the current shell session (macOS paths use forward slashes natively, so there's none of the backslash-escaping issue that affects `libpq` connection strings on Windows):

```bash
export RDS_ENDPOINT="research-tracker-dev-db.chqecwsweits.ap-southeast-2.rds.amazonaws.com"
export RDS_CA="$HOME/.aws/rds-global-bundle.pem"
```

Connect with whichever role you need — each prompts for that role's password interactively:

```bash
# Master account (admin only — creating roles, one-off fixes)
psql "host=$RDS_ENDPOINT port=5432 dbname=researchtracker user=dbadmin sslmode=verify-full sslrootcert=$RDS_CA"

# Migration role (DDL)
psql "host=$RDS_ENDPOINT port=5432 dbname=researchtracker user=research_tracker_migration sslmode=verify-full sslrootcert=$RDS_CA"

# Runtime/app role (DML only — what the running app uses)
psql "host=$RDS_ENDPOINT port=5432 dbname=researchtracker user=research_tracker_app sslmode=verify-full sslrootcert=$RDS_CA"
```

Useful commands once connected: `\dt` (list tables), `\du` (list roles), `\password` (change your own password), `\q` (quit).

If the migration and app roles don't exist yet on this instance, create them once via the master account — see step 5 of [dev-database-rds-setup.md](dev-database-rds-setup.md).

## 6. Point the project at RDS

From the repository root:

```bash
cp .env.example .env   # only if you don't already have one
open -e .env            # or: nano .env / code .env
```

Set the PostgreSQL values:

```env
POSTGRES_HOST=research-tracker-dev-db.chqecwsweits.ap-southeast-2.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=researchtracker
POSTGRES_SSL=true
POSTGRES_MIGRATION_USER=research_tracker_migration
POSTGRES_MIGRATION_PASSWORD=<MIGRATION_ROLE_PASSWORD>
POSTGRES_RUNTIME_USER=research_tracker_app
POSTGRES_RUNTIME_PASSWORD=<APPLICATION_ROLE_PASSWORD>
```

Never put the RDS master password in `.env`. The file is gitignored and must never be committed.

Node.js needs to trust the RDS certificate before it starts. Export this in every terminal session used to run migrations or the app — or add it to `~/.zshrc` to make it permanent:

```bash
export NODE_EXTRA_CA_CERTS="$HOME/.aws/rds-global-bundle.pem"
```

## 7. Create the application tables (first time only)

```bash
export NODE_EXTRA_CA_CERTS="$HOME/.aws/rds-global-bundle.pem"
pnpm --dir database/migrations db:migrate
```

Expected final line: `migrations applied successfully!`

Skip this if someone already ran migrations against this instance — running it again is safe (idempotent) but unnecessary.

## 8. Verify and run the app

```bash
psql "host=$RDS_ENDPOINT port=5432 dbname=researchtracker user=research_tracker_migration sslmode=verify-full sslrootcert=$RDS_CA"
```

```sql
\dt
SELECT COUNT(*) FROM drizzle.__drizzle_migrations;
\q
```

Then start the app:

```bash
export NODE_EXTRA_CA_CERTS="$HOME/.aws/rds-global-bundle.pem"
pnpm dev
```

Verify registration, login, workspace creation, projects, tasks, modules, notes, Settings profile updates, and `/health/ready`.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `psql: error: connection to server ... timeout expired` | Your IP isn't in the security group yet, or changed since you added it — redo step 2. |
| `psql: error: ... certificate verify failed` | `$RDS_CA` isn't pointing at a valid file, or `sslmode` isn't `verify-full`. |
| App fails to connect with a TLS/self-signed cert error | `NODE_EXTRA_CA_CERTS` isn't set in the terminal session running `pnpm dev`. |
| `FATAL: password authentication failed` | Wrong role/password, or connecting with the app role where a DDL-requiring action needs the migration role instead. |

## When you're done

This is a shared dev instance others may still be using — don't delete it yourself. If you're the one responsible for tearing it down, see step 9 of [dev-database-rds-setup.md](dev-database-rds-setup.md).
