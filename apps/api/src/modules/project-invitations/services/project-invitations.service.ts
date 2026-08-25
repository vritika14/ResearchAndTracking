import {
    ConflictException,
    ForbiddenException,
    GoneException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { createHash, randomBytes } from 'crypto';
  import { ProjectInvitationsRepository } from '../repositories/project-invitations.repository';
  import { ProjectCollaboratorsRepository } from '../../project-collaborators/repositories/project-collaborators.repository';
  import { EnumRepository } from '../../enum/repositories/enum.repository';
  import { ProjectsRepository } from '../../projects/repositories/projects.repository';
  import { DrizzleService } from '../../../db/drizzle.service';
  import { sql } from 'drizzle-orm';
  
  function normaliseEmail(value: string) {
    return value.trim().toLowerCase();
  }
  
  function hashInvitationToken(rawToken: string) {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }
  
  @Injectable()
  export class ProjectInvitationsService {
    constructor(
      private readonly repository: ProjectInvitationsRepository,
      private readonly configService: ConfigService,
      private readonly collaboratorsRepository: ProjectCollaboratorsRepository,
      private readonly enumRepository: EnumRepository,
      private readonly projectsRepository: ProjectsRepository,
      private readonly drizzle: DrizzleService,
    ) {}
  
    async list(projectId: string) {
      return this.repository.findByProject(projectId);
    }
  
    async invite(projectId: string, invitedBy: string, email: string) {
      const normalisedEmail = normaliseEmail(email);
  
      const tokenBytes = Number(this.configService.getOrThrow<string>('INVITATION_TOKEN_BYTES'));
      const ttlHours = Number(this.configService.getOrThrow<string>('INVITATION_TOKEN_TTL_HOURS'));
  
      const rawToken = randomBytes(tokenBytes).toString('base64url');
      const tokenHash = hashInvitationToken(rawToken);
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  
      const invitation = await this.repository.create({
        projectId,
        email: normalisedEmail,
        role: 'Collaborator',
        invitedBy,
        token: tokenHash,
        expiresAt,
      });
  
      if (!invitation) {
        throw new ConflictException('Failed to create invitation');
      }
  
      // The raw token is only ever returned here, once. Only its hash is stored.
      const { token: _storedHash, ...safeInvitation } = invitation;
      return {
        invitation: safeInvitation,
        acceptanceToken: rawToken,
      };
    }
  
    async preview(rawToken: string) {
      const invitation = await this.repository.findByToken(hashInvitationToken(rawToken));
      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }
      const titleResult = await this.drizzle.db.execute(
        sql`SELECT find_project_title_for_invitation(${invitation.projectId}) as title`,
      );
      const projectTitle = (titleResult.rows[0] as { title: string | null } | undefined)?.title ?? null;
      const { token: _hash, ...safeInvitation } = invitation;
      return { ...safeInvitation, projectTitle };
    }
  
    async accept(rawToken: string, userId: string, userEmail: string) {
        const tokenHash = hashInvitationToken(rawToken);
        const invitation = await this.repository.findByToken(tokenHash);
      
        if (!invitation) {
          throw new NotFoundException('Invitation not found');
        }
        if (invitation.status !== 'pending') {
          throw new GoneException('This invitation has already been used or revoked');
        }
        if (invitation.expiresAt.getTime() < Date.now()) {
          throw new GoneException('This invitation has expired');
        }
        if (normaliseEmail(invitation.email) !== normaliseEmail(userEmail)) {
          throw new ForbiddenException('Sign in with the email address that received this invitation');
        }
      
        const roleId = await this.enumRepository.findByCategoryAndValue('project_role', invitation.role);
        if (!roleId) {
          throw new NotFoundException(`Unknown project role: "${invitation.role}"`);
        }
      
        const projectResult = await this.drizzle.db.execute(
          sql`SELECT * FROM find_project_by_id_for_invitation(${invitation.projectId})`,
        );
        const projectRow = projectResult.rows[0] as { tenant_id: string } | undefined;
        if (!projectRow?.tenant_id) {
          throw new NotFoundException('Project not found');
        }
        
        await this.collaboratorsRepository.create({
          tenantId: projectRow.tenant_id,
          projectId: invitation.projectId,
          userId,
          roleId: roleId.id,
        });
      
        return this.repository.markAccepted(invitation.id);
      }
  
    async revoke(id: string) {
      const row = await this.repository.delete(id);
      if (!row) {
        throw new NotFoundException('Invitation not found');
      }
      return row;
    }
  
    async listForEmail(email: string) {
      return this.repository.findByEmail(normaliseEmail(email));
    }

    async listForEmailWithTitles(email: string) {
      const invitations = await this.repository.findByEmail(normaliseEmail(email));
      return Promise.all(
        invitations.map(async ({ token, ...rest }) => {
          const titleResult = await this.drizzle.db.execute(
            sql`SELECT find_project_title_for_invitation(${rest.projectId}) as title`,
          );
          const projectTitle = (titleResult.rows[0] as { title: string | null } | undefined)?.title ?? null;
          return { type: 'project' as const, ...rest, projectTitle };
        }),
      );
    }
  }
