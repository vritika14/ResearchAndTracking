import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { tenantMemberships, invitations } from '@research-tracker/migrations';
import { DrizzleService } from '../../../db/drizzle.service';
import { MembershipsRepository } from '../repositories/memberships.repository';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly repository: MembershipsRepository,
    private readonly drizzle: DrizzleService,
    private readonly configService: ConfigService,
  ) {}

  async listMembers(tenantId: string) {
    return this.repository.findActiveMembersByTenant(tenantId);
  }

  async inviteMember(
    tenantId: string,
    invitedBy: string,
    email: string,
    role: string,
  ) {
    const existing = await this.repository.findPendingInvitationByEmail(
      tenantId,
      email,
    );
    if (existing) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    const tokenBytes = this.configService.getOrThrow<number>(
      'INVITATION_TOKEN_BYTES',
    );
    const ttlHours = this.configService.getOrThrow<number>(
      'INVITATION_TOKEN_TTL_HOURS',
    );

    const token = randomBytes(tokenBytes).toString('hex');
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    return this.repository.createInvitation({
      tenantId,
      email,
      role,
      invitedBy,
      token,
      expiresAt,
    });
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.repository.findInvitationByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new GoneException(
        'This invitation has already been used or revoked',
      );
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new GoneException('This invitation has expired');
    }

    return this.drizzle.db.transaction(async (tx) => {
      const [updatedInvitation] = await tx
        .update(invitations)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(invitations.id, invitation.id))
        .returning();

      const [membership] = await tx
        .insert(tenantMemberships)
        .values({
          tenantId: invitation.tenantId,
          userId,
          role: invitation.role,
          invitedAt: invitation.createdAt,
          joinedAt: new Date(),
        })
        .returning();

      return { invitation: updatedInvitation, membership };
    });
  }

  async revokeMember(tenantId: string, membershipId: string) {
    const membership = await this.repository.findMembershipById(
      tenantId,
      membershipId,
    );

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return this.repository.revokeMembership(tenantId, membershipId);
  }
}
