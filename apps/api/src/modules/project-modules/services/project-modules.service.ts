import { Injectable, NotFoundException } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectModulesRepository } from '../repositories/project-modules.repository';

const ARCHIVE_RETENTION_DAYS = 14;

@Injectable()
export class ProjectModulesService {
  constructor(
    private readonly repository: ProjectModulesRepository,
    private readonly enumRepository: EnumRepository,
  ) {}

  async listActive(tenantId: string, projectId: string) {
    return this.repository.findActiveByProject(tenantId, projectId);
  }

  async findOne(tenantId: string, moduleId: string) {
    const module = await this.repository.findById(tenantId, moduleId);
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    return module;
  }

  async create(
    projectId: string,
    tenantId: string,
    input: {
      title: string;
      description?: string;
      tag?: string;
      status?: string;
      assignedToUserId?: string;
    },
  ) {
    const [tagId, statusId] = await Promise.all([
      this.resolveEnum('module_type', input.tag),
      this.resolveEnum('project_status', input.status),
    ]);

    return this.repository.create({
      projectId,
      tenantId,
      title: input.title,
      description: input.description,
      tagId,
      statusId,
      assignedToUserId: input.assignedToUserId,
    });
  }

  async update(
    tenantId: string,
    moduleId: string,
    input: Partial<{
      title: string;
      description: string;
      tag: string;
      status: string;
      assignedToUserId: string;
    }>,
  ) {
    await this.findOne(tenantId, moduleId);

    const [tagId, statusId] = await Promise.all([
      input.tag ? this.resolveEnum('module_type', input.tag) : undefined,
      input.status
        ? this.resolveEnum('project_status', input.status)
        : undefined,
    ]);

    const module = await this.repository.update(tenantId, moduleId, {
      title: input.title,
      description: input.description,
      tagId,
      statusId,
      assignedToUserId: input.assignedToUserId,
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }
    return module;
  }

  async archive(tenantId: string, moduleId: string) {
    await this.findOne(tenantId, moduleId);

    const archivedStatusId = await this.resolveEnum(
      'project_status',
      'Archived',
    );
    if (!archivedStatusId) {
      throw new NotFoundException(
        'Archived status is not configured in the enum table',
      );
    }

    const module = await this.repository.archive(
      tenantId,
      moduleId,
      archivedStatusId,
    );
    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return {
      module,
      warning: `This module has been archived and will be permanently deleted in ${ARCHIVE_RETENTION_DAYS} days.`,
    };
  }

  private async resolveEnum(
    category: string,
    value?: string,
  ): Promise<string | undefined> {
    if (!value) return undefined;
    const match = await this.enumRepository.findByCategoryAndValue(
      category,
      value,
    );
    if (!match) {
      throw new NotFoundException(`Unknown ${category} value: "${value}"`);
    }
    return match.id;
  }
}
