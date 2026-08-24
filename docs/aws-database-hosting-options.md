# AWS Database Hosting Options

## Context

Research in Motion currently uses PostgreSQL 16 with Drizzle ORM and SQL
migrations. The expected initial audience is approximately 30–40 users, with
growth to 100–200 users. User count alone is not a database sizing metric;
concurrent sessions, query complexity, stored files, and reporting workloads
will have a greater effect on capacity.

Keeping PostgreSQL avoids rewriting the application's relational schema,
foreign keys, repositories, and migrations.

## Options

| Option | Advantages | Trade-offs | Fit |
| --- | --- | --- | --- |
| **Amazon RDS for PostgreSQL** | Native PostgreSQL compatibility; automated backups and patching; vertical resizing; storage autoscaling; Multi-AZ and read-replica upgrade paths | Instance runs continuously; Multi-AZ costs more than Single-AZ | **Best overall choice** |
| **Aurora PostgreSQL Serverless** | Automatically adjusts compute capacity; can scale down to zero on supported versions; strong availability and read-scaling options | More configuration and less predictable cost; unnecessary complexity for a small, steady workload | Good for intermittent or unpredictable traffic |
| **Amazon Lightsail managed PostgreSQL** | Simple setup and predictable bundled pricing; snapshots and optional high availability | Scaling requires creating a larger database from a snapshot; fewer networking and operational controls than RDS | Good for prototypes or tightly constrained budgets |
| **PostgreSQL on EC2** | Full operating-system and PostgreSQL control | Team must manage patching, backups, monitoring, encryption, recovery, and high availability | Not recommended for this application |

Amazon DynamoDB is not included as a direct option because moving to it would
require redesigning the relational data model and rewriting the Drizzle
repositories.

## Recommendation

Start with **Amazon RDS for PostgreSQL 16 in `ap-southeast-2`**.

For development or an early pilot:

- Use a small burstable instance and General Purpose SSD storage.
- Use Single-AZ while downtime is acceptable.
- Enable storage autoscaling, encryption, automated backups, and deletion
  protection.

For production:

- Place RDS in private subnets and allow port 5432 only from the API's security
  group.
- Use Multi-AZ when the application requires automatic failover.
- Store database credentials in AWS Secrets Manager rather than application
  files.
- Require TLS connections and set `POSTGRES_SSL=true`.
- Monitor connections, CPU, free memory, storage, and query latency in
  CloudWatch.

Thirty to 200 users should normally remain well within a modest RDS PostgreSQL
deployment. Scale vertically first by changing the DB instance class. Add a
read replica only if monitoring shows sustained read pressure. Aurora
Serverless becomes attractive if usage is highly bursty or the database sits
idle for long periods.

## Migration outline

1. Create the RDS PostgreSQL instance, database, security groups, backups, and
   encryption settings through OpenTofu.
2. Create the existing migration and runtime roles in the new database.
3. Export the local database with `pg_dump` and import it with `pg_restore`.
4. Update the deployment secrets for `POSTGRES_HOST`, `POSTGRES_PORT`,
   `POSTGRES_DB`, and the migration/runtime credentials.
5. Set `POSTGRES_SSL=true` and install the AWS RDS CA certificate where strict
   certificate verification is enabled.
6. Run `pnpm --dir database/migrations db:migrate` against RDS.
7. Verify `/health/ready`, authentication, workspace creation, and CRUD flows.
8. Keep the local database read-only until the RDS data and application are
   verified, then take a final backup before retiring it.

For this small database, `pg_dump`/`pg_restore` with a short maintenance window
is simpler than AWS Database Migration Service. DMS is worth considering later
if near-zero-downtime migration becomes necessary.

## Cost notes

RDS and Aurora prices vary by AWS Region, instance or ACU capacity, storage,
backup retention, data transfer, and availability configuration. Use the AWS
Pricing Calculator before provisioning. Lightsail provides fixed bundles,
starting at USD 15 per month for its smallest standard managed database, but
that entry plan does not include data encryption; production workloads should
use an encrypted and preferably high-availability option.

## References

- [Amazon RDS for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [RDS concepts: backups, security, and scaling](https://docs.aws.amazon.com/AmazonRDS/latest/gettingstartedguide/concepts.html)
- [Aurora Serverless capacity and scaling](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.requirements.html)
- [Lightsail managed database capabilities](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-faq-databases.html)
- [RDS for PostgreSQL pricing](https://aws.amazon.com/rds/postgresql/pricing/)
- [Lightsail pricing](https://aws.amazon.com/lightsail/pricing/)
