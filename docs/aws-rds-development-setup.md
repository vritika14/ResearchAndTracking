# Temporary AWS PostgreSQL Development Database

## Recommendation and free-tier warning

Use **Amazon RDS for PostgreSQL 16**, Single-AZ, with a `db.t4g.micro` or
`db.t3.micro` instance that the RDS console explicitly labels as Free tier.
This is the closest managed replacement for the current PostgreSQL 16 database
and requires no application or schema redesign.

RDS is not permanently free. New AWS Free Plan accounts receive credits and can
use eligible RDS instances for up to six months. Older eligible accounts may
have the legacy 12-month allowance. Check **AWS Console > Billing and Cost
Management > Free Tier** before creating anything. Create a small AWS Budget
alert as an additional safeguard, and delete the database when development is
finished.

## 1. Confirm permissions and free-tier eligibility

1. Sign in to AWS Console and select **Asia Pacific (Sydney),
   `ap-southeast-2`**.
2. Open **Billing and Cost Management > Free Tier** and confirm that the account
   has Free Plan credits or legacy RDS Free Tier eligibility.
3. Create a budget alert, for example at USD 5.
4. Ensure the AWS identity creating the database can manage RDS, EC2 security
   groups, and related networking. If this is an organisation account, request
   access from its administrator.

## 2. Create the RDS PostgreSQL instance

Open **Amazon RDS > Databases > Create database** and select **Full
configuration**.

Use these settings:

| Setting | Value |
| --- | --- |
| Engine | PostgreSQL |
| Engine version | PostgreSQL 16.x |
| Template | Free tier, if displayed |
| Availability | Single DB instance / Single-AZ |
| DB identifier | `research-tracker-dev-db` |
| Master username | `dbadmin` |
| Credentials | Self managed; generate a strong unique password |
| Instance class | `db.t4g.micro` or `db.t3.micro`, whichever is labelled Free tier |
| Storage | 20 GiB General Purpose SSD; disable storage autoscaling for cost control |
| VPC | Default VPC for this temporary local-development setup |
| Public access | Yes |
| VPC security group | Create new: `research-tracker-dev-rds` |
| Port | 5432 |
| Initial database name | `researchtracker` |
| Encryption | Enabled with the default AWS-managed RDS key |
| Backup retention | 1 day |
| Enhanced Monitoring | Disabled |
| Performance Insights / Database Insights paid mode | Disabled |
| Deletion protection | Disabled because this database is temporary |

Create the database and wait until its status becomes **Available**. Open its
**Connectivity & security** tab and copy the **Endpoint**. The endpoint is a DNS
name; do not copy the ARN.

## 3. Restrict network access to this Windows laptop

1. On the database's **Connectivity & security** tab, open its VPC security
   group.
2. Open **Inbound rules > Edit inbound rules**.
3. Add one rule:
   - Type: PostgreSQL
   - Protocol: TCP
   - Port: 5432
   - Source: **My IP** (`your-public-IP/32`)
4. Save the rule.

Never use `0.0.0.0/0` for PostgreSQL. If the internet connection's public IP
changes, update this rule. Test access from PowerShell:

```powershell
Test-NetConnection <RDS_ENDPOINT> -Port 5432
```

Continue only when `TcpTestSucceeded` is `True`.

## 4. Install a PostgreSQL client and the RDS CA certificate

Check whether `psql` is installed:

```powershell
psql --version
```

If it is missing, install the PostgreSQL command-line tools using the official
Windows PostgreSQL installer, then reopen PowerShell.

Download AWS's RDS certificate bundle:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.aws" | Out-Null
Invoke-WebRequest `
  -Uri "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" `
  -OutFile "$env:USERPROFILE\.aws\rds-global-bundle.pem"
```

Set convenient variables for the current PowerShell window:

```powershell
$RdsEndpoint = "<RDS_ENDPOINT>"
$RdsCa = "$env:USERPROFILE\.aws\rds-global-bundle.pem"
```

## 5. Create the migration and application roles

Connect using the RDS master account. `psql` prompts for the master password:

```powershell
psql "host=$RdsEndpoint port=5432 dbname=researchtracker user=dbadmin sslmode=verify-full sslrootcert=$RdsCa"
```

At the `researchtracker=>` prompt, run:

```sql
CREATE ROLE research_tracker_migration LOGIN;
\password research_tracker_migration

CREATE ROLE research_tracker_app LOGIN;
\password research_tracker_app

GRANT CREATE ON DATABASE researchtracker TO research_tracker_migration;
GRANT ALL PRIVILEGES ON SCHEMA public TO research_tracker_migration;
GRANT CONNECT ON DATABASE researchtracker TO research_tracker_app;
GRANT USAGE ON SCHEMA public TO research_tracker_app;
```

The two `\password` commands securely prompt for new, different passwords.
Store those passwords in a password manager. Exit `psql`:

```text
\q
```

Do not use the RDS master account in the running application.

## 6. Point the project at RDS

From the repository root, open the ignored local environment file:

```powershell
Set-Location "C:\Users\Avi\Documents\GitHub\ResearchAndTracking"
notepad .env
```

Update only the PostgreSQL values:

```env
POSTGRES_HOST=<RDS_ENDPOINT>
POSTGRES_PORT=5432
POSTGRES_DB=researchtracker
POSTGRES_SSL=true
POSTGRES_MIGRATION_USER=research_tracker_migration
POSTGRES_MIGRATION_PASSWORD=<MIGRATION_ROLE_PASSWORD>
POSTGRES_RUNTIME_USER=research_tracker_app
POSTGRES_RUNTIME_PASSWORD=<APPLICATION_ROLE_PASSWORD>
```

Do not put the RDS master password in `.env`. The file is ignored by Git and
must never be committed.

Node.js must trust the RDS certificate before it starts. In every new
PowerShell window used to run migrations or the application, set:

```powershell
$env:NODE_EXTRA_CA_CERTS = "$env:USERPROFILE\.aws\rds-global-bundle.pem"
```

## 7. Create all application tables

From the repository root, run:

```powershell
$env:NODE_EXTRA_CA_CERTS = "$env:USERPROFILE\.aws\rds-global-bundle.pem"
pnpm --dir database/migrations db:migrate
```

Drizzle applies every SQL migration and creates the tables, foreign keys,
indexes, enum seed data, runtime grants, and profile columns. Do not create the
application tables manually in the RDS console.

Expected final message:

```text
migrations applied successfully!
```

## 8. Verify the tables and application

Connect with the migration role:

```powershell
psql "host=$RdsEndpoint port=5432 dbname=researchtracker user=research_tracker_migration sslmode=verify-full sslrootcert=$RdsCa"
```

Then run:

```sql
\dt
SELECT COUNT(*) FROM drizzle.__drizzle_migrations;
SELECT category, value FROM enum ORDER BY category, sort_order;
\q
```

Start the application from the same PowerShell window:

```powershell
$env:NODE_EXTRA_CA_CERTS = "$env:USERPROFILE\.aws\rds-global-bundle.pem"
pnpm dev
```

Verify registration, login, workspace creation, projects, tasks, modules,
notes, Settings profile updates, and `/health/ready`.

## 9. Delete the temporary database

When development is complete:

1. Take a `pg_dump` first if any data must be retained.
2. Open **RDS > Databases > research-tracker-dev-db > Actions > Delete**.
3. For disposable data, do not create a final snapshot and delete retained
   automated backups.
4. Delete any manual RDS snapshots that are no longer required because they
   continue to incur storage charges.
5. Delete the `research-tracker-dev-rds` security group if nothing uses it.
6. Confirm in Billing that no RDS instance or snapshot remains.

## References

- [AWS Free database offers](https://aws.amazon.com/free/database/)
- [Amazon RDS Free Tier](https://aws.amazon.com/rds/free/)
- [Create an RDS PostgreSQL instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html)
- [Troubleshoot RDS PostgreSQL connectivity](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ConnectToPostgreSQLInstance.Troubleshooting.html)
- [Use SSL with RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html)
