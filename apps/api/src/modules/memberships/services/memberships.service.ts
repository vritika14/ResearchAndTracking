import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  invitations,
  tenantMemberships,
  workspaceContexts,
} from '@research-tracker/migrations';
import { and, eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { DrizzleService } from '../../../db/drizzle.service';
import { MembershipsRepository } from '../repositories/memberships.repository';
import { InvitationEmailService } from './invitation-email.service';

function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashInvitationToken(rawToken: string) {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

function maskEmail(value: string) {
  const [local = '', domain = ''] = value.split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

@Injectable()
export class MembershipsService {
  constructor(
    private readonly repository: MembershipsRepository,
    private readonly drizzle: DrizzleService,
    private readonly configService: ConfigService,
    private readonly invitationEmailService: InvitationEmailService,
  ) {}

  async listMembers(tenantId: string) {
    return this.repository.findActiveMembersByTenant(tenantId);
  }

  async inviteMember(tenantId: string, invitedBy: string, email: string) {
    const normalisedEmail = normaliseEmail(email);
    const existing = await this.repository.findPendingInvitationByEmail(
      tenantId,
      normalisedEmail,
    );
    if (existing) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    const tenant = await this.repository.findTenantById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Workspace not found');
    }

    const tokenBytes = this.configService.getOrThrow<number>(
      'INVITATION_TOKEN_BYTES',
    );
    const ttlHours = this.configService.getOrThrow<number>(
      'INVITATION_TOKEN_TTL_HOURS',
    );

    const rawToken = randomBytes(tokenBytes).toString('base64url');
    const tokenHash = hashInvitationToken(rawToken);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const invitation = await this.repository.createInvitation({
      tenantId,
      email: normalisedEmail,
      role: 'limited_member',
      invitedBy,
      tokenHash,
      expiresAt,
    });

    if (!invitation) {
      throw new ConflictException('Failed to create invitation');
    }

    try {
      await this.invitationEmailService.sendInvitation({
        email: normalisedEmail,
        workspaceName: tenant.name,
        acceptanceToken: rawToken,
        expiresAt,
      });
    } catch (error) {
      await this.repository.deleteInvitation(invitation.id);
      throw error;
    }

    // The raw token is sent through SES and returned once for API compatibility.
    // Only the hash is stored in PostgreSQL and request logging masks token paths.
    const { token: _storedHash, ...safeInvitation } = invitation;
    return {
      invitation: safeInvitation,
      acceptanceToken: rawToken,
      emailSent: true,
    };
  }

  async previewInvitation(rawToken: string) {
    const invitation = await this.repository.findInvitationByTokenHash(
      hashInvitationToken(rawToken),
    );

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw new GoneException('This invitation is no longer active');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new GoneException('This invitation has expired');
    }

    return {
      workspaceName: invitation.tenantName,
      invitedEmail: maskEmail(invitation.email),
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  async acceptInvitation(rawToken: string, userId: string, userEmail: string) {
    const tokenHash = hashInvitationToken(rawToken);
    const invitation =
      await this.repository.findInvitationByTokenHash(tokenHash);

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
    if (normaliseEmail(invitation.email) !== normaliseEmail(userEmail)) {
      throw new ForbiddenException(
        'Sign in with the email address that received this invitation',
      );
    }

    return this.drizzle.db.transaction(async (tx) => {
      const [updatedInvitation] = await tx
        .update(invitations)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(
          and(
            eq(invitations.id, invitation.id),
            eq(invitations.status, 'pending'),
          ),
        )
        .returning();

      if (!updatedInvitation) {
        throw new ConflictException(
          'Invitation was accepted by another request',
        );
      }

      const [membership] = await tx
        .insert(tenantMemberships)
        .values({
          tenantId: invitation.tenantId,
          userId,
          role: 'limited_member',
          status: 'active',
          invitedAt: invitation.createdAt,
          joinedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [tenantMemberships.tenantId, tenantMemberships.userId],
          set: {
            role: 'limited_member',
            status: 'active',
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning();

      await tx
        .insert(workspaceContexts)
        .values({
          userId,
          tenantId: invitation.tenantId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: workspaceContexts.userId,
          set: { tenantId: invitation.tenantId, updatedAt: new Date() },
        });

      return { membership };
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
    if (membership.role === 'owner') {
      throw new ForbiddenException(
        'The primary workspace owner cannot be revoked through the member API',
      );
    }

    const revoked = await this.repository.revokeMembership(
      tenantId,
      membershipId,
    );
    return revoked ? { ...membership, ...revoked } : revoked;
  }
}
