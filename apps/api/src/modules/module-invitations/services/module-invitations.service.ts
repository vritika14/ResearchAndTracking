import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { sql } from 'drizzle-orm';
import { ModuleInvitationsRepository } from '../repositories/module-invitations.repository';
import { ModuleCollaboratorsRepository } from '../../module-collaborators/repositories/module-collaborators.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectModulesRepository } from '../../project-modules/repositories/project-modules.repository';
import { DrizzleService } from '../../../db/drizzle.service';
import { InvitationEmailService } from '../../invitation-email/invitation-email.service';

function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashInvitationToken(rawToken: string) {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

@Injectable()
export class ModuleInvitationsService {
  constructor(
    private readonly repository: ModuleInvitationsRepository,
    private readonly configService: ConfigService,
    private readonly collaboratorsRepository: ModuleCollaboratorsRepository,
    private readonly enumRepository: EnumRepository,
    private readonly modulesRepository: ProjectModulesRepository,
    private readonly drizzle: DrizzleService,
    private readonly invitationEmailService: InvitationEmailService,
  ) {}

  async list(moduleId: string) {
    return this.repository.findByModule(moduleId);
  }

  async invite(moduleId: string, invitedBy: string, email: string) {
    const normalisedEmail = normaliseEmail(email);
    const module = await this.modulesRepository.findByIdGlobal(moduleId);
    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const tokenBytes = Number(
      this.configService.getOrThrow<string>('INVITATION_TOKEN_BYTES'),
    );
    const ttlHours = Number(
      this.configService.getOrThrow<string>('INVITATION_TOKEN_TTL_HOURS'),
    );

    const rawToken = randomBytes(tokenBytes).toString('base64url');
    const tokenHash = hashInvitationToken(rawToken);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const invitation = await this.repository.create({
      moduleId,
      email: normalisedEmail,
      role: 'Collaborator',
      invitedBy,
      token: tokenHash,
      expiresAt,
    });

    if (!invitation) {
      throw new ConflictException('Failed to create invitation');
    }

    try {
      await this.invitationEmailService.sendInvitation({
        email: normalisedEmail,
        targetType: 'module',
        targetTitle: module.title,
        acceptanceToken: rawToken,
        expiresAt,
      });
    } catch (error) {
      await this.repository.delete(invitation.moduleId, invitation.id);
      throw error;
    }

    const { token: _storedHash, ...safeInvitation } = invitation;
    return {
      invitation: safeInvitation,
      acceptanceToken: rawToken,
      emailSent: true,
    };
  }

  async preview(rawToken: string) {
    const invitation = await this.repository.findByToken(
      hashInvitationToken(rawToken),
    );
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    const titleResult = await this.drizzle.db.execute(
      sql`SELECT find_module_title_for_invitation(${invitation.moduleId}) as title`,
    );
    const moduleTitle =
      (titleResult.rows[0] as { title: string | null } | undefined)?.title ??
      null;
    const { token: _hash, ...safeInvitation } = invitation;
    return { ...safeInvitation, moduleTitle };
  }

  async accept(rawToken: string, userId: string, userEmail: string) {
    const tokenHash = hashInvitationToken(rawToken);
    const invitation = await this.repository.findByToken(tokenHash);

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

    const roleId = await this.enumRepository.findByCategoryAndValue(
      'project_role',
      invitation.role,
    );
    if (!roleId) {
      throw new NotFoundException(`Unknown project role: "${invitation.role}"`);
    }

    const module = await this.modulesRepository.findByIdGlobal(
      invitation.moduleId,
    );
    if (!module) {
      throw new NotFoundException('Module not found');
    }

    await this.collaboratorsRepository.create({
      tenantId: module.tenantId,
      moduleId: invitation.moduleId,
      userId,
      roleId: roleId.id,
    });

    return this.repository.markAccepted(invitation.id);
  }

  async revoke(moduleId: string, id: string) {
    const row = await this.repository.delete(moduleId, id);
    if (!row) {
      throw new NotFoundException('Invitation not found');
    }
    return row;
  }

  async listForEmail(email: string) {
    return this.repository.findByEmail(normaliseEmail(email));
  }

  async listForEmailWithTitles(email: string) {
    const invitations = await this.repository.findByEmail(
      normaliseEmail(email),
    );
    return Promise.all(
      invitations.map(async ({ token: _token, ...rest }) => {
        const titleResult = await this.drizzle.db.execute(
          sql`SELECT find_module_title_for_invitation(${rest.moduleId}) as title`,
        );
        const moduleTitle =
          (titleResult.rows[0] as { title: string | null } | undefined)
            ?.title ?? null;
        return { type: 'module' as const, ...rest, moduleTitle };
      }),
    );
  }
}
