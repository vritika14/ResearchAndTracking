import { Injectable } from '@nestjs/common';
import {
  invitations,
  tenantMemberships,
  tenants,
  users,
} from '@research-tracker/migrations';
import { and, eq } from 'drizzle-orm';
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
    const [membership] = await this.drizzle.db
      .select()
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.userId, userId),
        ),
      );
    return membership;
  }

  async findMembershipById(tenantId: string, membershipId: string) {
    const [membership] = await this.drizzle.db
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
          eq(tenantMemberships.id, membershipId),
        ),
      );
    return membership;
  }

  async revokeMembership(tenantId: string, membershipId: string) {
    const [membership] = await this.drizzle.db
      .update(tenantMemberships)
      .set({ status: 'revoked', updatedAt: new Date() })
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.id, membershipId),
        ),
      )
      .returning();
    return membership;
  }

  async findPendingInvitationByEmail(tenantId: string, email: string) {
    const [invitation] = await this.drizzle.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.tenantId, tenantId),
          eq(invitations.email, email),
          eq(invitations.status, 'pending'),
        ),
      );
    return invitation;
  }

  async findInvitationByTokenHash(tokenHash: string) {
    const [result] = await this.drizzle.db
      .select({
        id: invitations.id,
        tenantId: invitations.tenantId,
        tenantName: tenants.name,
        email: invitations.email,
        role: invitations.role,
        invitedBy: invitations.invitedBy,
        token: invitations.token,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
        updatedAt: invitations.updatedAt,
      })
      .from(invitations)
      .innerJoin(tenants, eq(tenants.id, invitations.tenantId))
      .where(eq(invitations.token, tokenHash));
    return result;
  }

  async createInvitation(values: {
    tenantId: string;
    email: string;
    role: 'limited_member';
    invitedBy: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const [invitation] = await this.drizzle.db
      .insert(invitations)
      .values({
        tenantId: values.tenantId,
        email: values.email,
        role: values.role,
        invitedBy: values.invitedBy,
        token: values.tokenHash,
        expiresAt: values.expiresAt,
      })
      .returning();
    return invitation;
  }
}
