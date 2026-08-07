import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';
import { tenantMemberships, invitations } from '@research-tracker/migrations';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  // --- Memberships ---

  async findActiveMembersByTenant(tenantId: string) {
    return this.drizzle.db
      .select()
      .from(tenantMemberships)
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
      .select()
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.id, membershipId),
        ),
      );

    return membership;
  }

  async createMembership(values: {
    tenantId: string;
    userId: string;
    role: string;
    invitedAt: Date;
    joinedAt: Date;
  }) {
    const [membership] = await this.drizzle.db
      .insert(tenantMemberships)
      .values(values)
      .returning();

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

  // --- Invitations ---

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

  async findInvitationByToken(token: string) {
    const [invitation] = await this.drizzle.db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));

    return invitation;
  }

  async createInvitation(values: {
    tenantId: string;
    email: string;
    role: string;
    invitedBy: string;
    token: string;
    expiresAt: Date;
  }) {
    const [invitation] = await this.drizzle.db
      .insert(invitations)
      .values(values)
      .returning();

    return invitation;
  }

  async markInvitationAccepted(invitationId: string) {
    const [invitation] = await this.drizzle.db
      .update(invitations)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(invitations.id, invitationId))
      .returning();

    return invitation;
  }
}
