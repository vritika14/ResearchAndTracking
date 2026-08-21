// apps/api/src/modules/module-collaborators/services/module-collaborators.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectCollaboratorsRepository } from '../../project-collaborators/repositories/project-collaborators.repository';
import { ProjectModulesRepository } from '../../project-modules/repositories/project-modules.repository';
import { ModuleCollaboratorsRepository } from '../repositories/module-collaborators.repository';

@Injectable()
export class ModuleCollaboratorsService {
  constructor(
    private readonly repository: ModuleCollaboratorsRepository,
    private readonly modulesRepository: ProjectModulesRepository,
    private readonly projectCollaboratorsRepository: ProjectCollaboratorsRepository,
    private readonly enumRepository: EnumRepository,
  ) {}

  /**
   * The collaborator list is itself only visible to someone who can already
   * see the module: for a project-scoped module, a collaborator on that
   * project; for an independent module, an existing module collaborator.
   */
  async list(tenantId: string, moduleId: string, callerUserId: string) {
    const module = await this.modulesRepository.findById(tenantId, moduleId);
    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const hasAccess = module.projectId
      ? Boolean(
          await this.projectCollaboratorsRepository.findByProjectAndUser(
            tenantId,
            module.projectId,
            callerUserId,
          ),
        )
      : Boolean(
          await this.repository.findByModuleAndUser(
            tenantId,
            moduleId,
            callerUserId,
          ),
        );
    if (!hasAccess) {
      throw new NotFoundException('Module not found');
    }

    return this.repository.findByModule(tenantId, moduleId);
  }

  async add(tenantId: string, moduleId: string, userId: string, role: string) {
    const module = await this.modulesRepository.findById(tenantId, moduleId);
    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const existing = await this.repository.findByModuleAndUser(
      tenantId,
      moduleId,
      userId,
    );
    if (existing) {
      throw new ConflictException(
        'This user is already a collaborator on this module',
      );
    }

    const roleId = await this.resolveRole(role);

    return this.repository.create({
      tenantId,
      projectId: module.projectId ?? undefined,
      moduleId,
      userId,
      roleId,
    });
  }

  async updateRole(
    tenantId: string,
    moduleId: string,
    userId: string,
    role: string,
  ) {
    const roleId = await this.resolveRole(role);

    const row = await this.repository.updateRole(
      tenantId,
      moduleId,
      userId,
      roleId,
    );
    if (!row) {
      throw new NotFoundException('Collaborator not found on this module');
    }
    return row;
  }

  async remove(tenantId: string, moduleId: string, userId: string) {
    const row = await this.repository.delete(tenantId, moduleId, userId);
    if (!row) {
      throw new NotFoundException('Collaborator not found on this module');
    }
    return row;
  }

  private async resolveRole(role: string): Promise<string> {
    const match = await this.enumRepository.findByCategoryAndValue(
      'project_role',
      role,
    );
    if (!match) {
      throw new NotFoundException(`Unknown project role: "${role}"`);
    }
    return match.id;
  }
}
