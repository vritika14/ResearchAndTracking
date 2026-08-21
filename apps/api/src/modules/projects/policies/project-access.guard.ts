// apps/api/src/modules/projects/policies/project-access.guard.ts
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Request } from 'express';
  import { UsersService } from '../../users/users.service';
  import { ProjectCollaboratorsRepository } from '../../project-collaborators/repositories/project-collaborators.repository';
  
  interface AuthenticatedRequest extends Request {
    user: { sub: string; username?: string };
    params: { tenantId?: string; projectId?: string };
  }
  
  @Injectable()
  export class ProjectAccessGuard implements CanActivate {
    constructor(
      private readonly usersService: UsersService,
      private readonly repository: ProjectCollaboratorsRepository,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const { tenantId, projectId } = req.params;
  
      if (!tenantId || !projectId) {
        throw new ForbiddenException('Tenant and project context are required');
      }
  
      const user = await this.usersService.findByExternalAuthId(req.user.sub);
      const collaborator = await this.repository.findByProjectAndUser(tenantId, projectId, user.id);
  
      if (!collaborator) {
        throw new ForbiddenException('You do not have access to this project');
      }
  
      return true;
    }
  }
  