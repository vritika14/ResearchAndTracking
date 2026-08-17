// apps/api/src/modules/project-collaborators/services/project-collaborators.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectCollaboratorsRepository } from '../repositories/project-collaborators.repository';

@Injectable()
export class ProjectCollaboratorsService {
  constructor(
    private readonly repository: ProjectCollaboratorsRepository,
    private readonly enumRepository: EnumRepository,
  ) {}

  async list(tenantId: string, projectId: string) {
    return this.repository.findByProject(tenantId, projectId);
  }

  async add(tenantId: string, projectId: string, userId: string, role: string) {
    const existing = await this.repository.findByProjectAndUser(
      tenantId,
      projectId,
      userId,
    );
    if (existing) {
      throw new ConflictException(
        'This user is already a collaborator on this project',
      );
    }

    const roleId = await this.resolveRole(role);

    return this.repository.create({ tenantId, projectId, userId, roleId });
  }

  async updateRole(
    tenantId: string,
    projectId: string,
    userId: string,
    role: string,
  ) {
    const roleId = await this.resolveRole(role);

    const row = await this.repository.updateRole(
      tenantId,
      projectId,
      userId,
      roleId,
    );
    if (!row) {
      throw new NotFoundException('Collaborator not found on this project');
    }
    return row;
  }

  async remove(tenantId: string, projectId: string, userId: string) {
    const row = await this.repository.delete(tenantId, projectId, userId);
    if (!row) {
      throw new NotFoundException('Collaborator not found on this project');
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
