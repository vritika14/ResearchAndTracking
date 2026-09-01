import { Injectable } from '@nestjs/common';
import { tenantMemberships, users } from '@research-tracker/migrations';
import { and, eq, sql } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findActiveMembersByTenant(tenantId: string) {
    return this.drizzle.db
      .select({
        id: tenantMemberships.id,
        tenantId: tenantMemberships.tenantId,
        userId: tenantMemberships.userId,
        email: users.email,
        displayName: users.displayName,
        role: tenantMemberships.role,
        status: tenantMemberships.status,
        invitedAt: tenantMemberships.invitedAt,
        joinedAt: tenantMemberships.joinedAt,
        createdAt: tenantMemberships.createdAt,
        updatedAt: tenantMemberships.updatedAt,
      })
      .from(tenantMemberships)
      .innerJoin(users, eq(users.id, tenantMemberships.userId))
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.status, 'active'),
        ),
      );
  }

  async findMembershipByTenantAndUser(tenantId: string, userId: string) {
    const result = await this.drizzle.db.execute(
      sql`SELECT * FROM check_tenant_membership(${tenantId}::uuid, ${userId}::uuid)`,
    );
    return result.rows[0] as { id: string; role: string; status: string } | undefined;
  }
}
