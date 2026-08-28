import { Injectable } from '@nestjs/common';
import {
  tenantMemberships,
  tenants,
  workspaceContexts,
} from '@research-tracker/migrations';
import { and, asc, eq } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAllByMemberUserId(userId: string) {
    return this.drizzle.db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        ownerUserId: tenants.ownerUserId,
        status: tenants.status,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        membershipRole: tenantMemberships.role,
      })
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
      .where(
        and(
          eq(tenantMemberships.userId, userId),
          eq(tenantMemberships.status, 'active'),
          eq(tenants.status, 'active'),
        ),
      )
      .orderBy(asc(tenants.name));
  }

  async findWorkspaceForMember(userId: string, tenantId: string) {
    const [result] = await this.drizzle.db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        ownerUserId: tenants.ownerUserId,
        status: tenants.status,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        membershipRole: tenantMemberships.role,
      })
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
      .where(
        and(
          eq(tenantMemberships.userId, userId),
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.status, 'active'),
          eq(tenants.status, 'active'),
        ),
      );
    return result;
  }

  async findCurrentByUserId(userId: string) {
    const [result] = await this.drizzle.db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        ownerUserId: tenants.ownerUserId,
        status: tenants.status,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        membershipRole: tenantMemberships.role,
      })
      .from(workspaceContexts)
      .innerJoin(tenants, eq(tenants.id, workspaceContexts.tenantId))
      .innerJoin(
        tenantMemberships,
        and(
          eq(tenantMemberships.tenantId, tenants.id),
          eq(tenantMemberships.userId, workspaceContexts.userId),
        ),
      )
      .where(
        and(
          eq(workspaceContexts.userId, userId),
          eq(tenantMemberships.status, 'active'),
          eq(tenants.status, 'active'),
        ),
      );
    return result;
  }

  async setCurrentWorkspace(userId: string, tenantId: string) {
    await this.drizzle.db
      .insert(workspaceContexts)
      .values({ userId, tenantId, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: workspaceContexts.userId,
        set: { tenantId, updatedAt: new Date() },
      });
  }

  /**
   * Only deletes when `ownerUserId` actually owns the tenant. Every other
   * table keyed on tenantId (projects, modules, tasks, notes, enum,
   * memberships, workspace_contexts, ...) cascades on delete, so this alone
   * removes the workspace and everything in it.
   */
  async deleteById(tenantId: string, ownerUserId: string) {
    const [row] = await this.drizzle.db
      .delete(tenants)
      .where(
        and(eq(tenants.id, tenantId), eq(tenants.ownerUserId, ownerUserId)),
      )
      .returning();
    return row;
  }
}
