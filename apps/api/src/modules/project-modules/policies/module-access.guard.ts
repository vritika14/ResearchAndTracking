// apps/api/src/modules/project-modules/policies/module-access.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { ProjectModulesRepository } from '../repositories/project-modules.repository';
import { ProjectCollaboratorsRepository } from '../../project-collaborators/repositories/project-collaborators.repository';
import { ModuleCollaboratorsRepository } from '../../module-collaborators/repositories/module-collaborators.repository';

interface AuthenticatedRequest extends Request {
  user: { sub: string; username?: string };
  params: { tenantId?: string; moduleId?: string };
}

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly modulesRepository: ProjectModulesRepository,
    private readonly projectCollaboratorsRepository: ProjectCollaboratorsRepository,
    private readonly moduleCollaboratorsRepository: ModuleCollaboratorsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { tenantId, moduleId } = req.params;

    if (!tenantId || !moduleId) {
      throw new ForbiddenException('Tenant and module context are required');
    }

    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    const module = await this.modulesRepository.findById(tenantId, moduleId);

    if (!module) {
      throw new ForbiddenException('Module not found');
    }

    if (module.projectId) {
      const projectCollaborator =
        await this.projectCollaboratorsRepository.findByProjectAndUser(
          tenantId,
          module.projectId,
          user.id,
        );
      if (projectCollaborator) {
        return true;
      }
    }

    const moduleCollaborator =
      await this.moduleCollaboratorsRepository.findByModuleAndUser(
        tenantId,
        moduleId,
        user.id,
      );

    if (!moduleCollaborator) {
      throw new ForbiddenException('You do not have access to this module');
    }

    return true;
  }
}
