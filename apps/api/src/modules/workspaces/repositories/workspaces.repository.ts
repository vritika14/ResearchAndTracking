import { Injectable } from '@nestjs/common';
import { tenantMemberships, tenants } from '@research-tracker/migrations';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByOwnerUserId(ownerUserId: string) {
    const [tenant] = await this.drizzle.db
      .select()
      .from(tenants)
      .where(eq(tenants.ownerUserId, ownerUserId));
    return tenant;
  }

  async findByMemberUserId(userId: string) {
    const [result] = await this.drizzle.db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        ownerUserId: tenants.ownerUserId,
        status: tenants.status,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
      .where(
        and(
          eq(tenantMemberships.userId, userId),
          eq(tenantMemberships.status, 'active'),
        ),
      );
    return result;
  }
}
