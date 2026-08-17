import { Injectable, NotFoundException } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ModuleCollaboratorsRepository } from '../../module-collaborators/repositories/module-collaborators.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';
import { ProjectModulesRepository } from '../repositories/project-modules.repository';

const ARCHIVE_RETENTION_DAYS = 14;

@Injectable()
export class ProjectModulesService {
  constructor(
    private readonly repository: ProjectModulesRepository,
    private readonly enumRepository: EnumRepository,
    private readonly collaboratorsRepository: ModuleCollaboratorsRepository,
    private readonly sequences: TenantSequencesRepository,
  ) {}

  async listActive(tenantId: string, callerUserId: string, projectId?: string) {
    const rows = await this.repository.findActiveByTenant(tenantId, projectId);
    return this.withDisplayValues(tenantId, rows, callerUserId);
  }

  async findOne(tenantId: string, moduleId: string, callerUserId: string) {
    const module = await this.repository.findById(tenantId, moduleId);
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    const [shaped] = await this.withDisplayValues(
      tenantId,
      [module],
      callerUserId,
    );
    return shaped;
  }

  async create(
    tenantId: string,
    callerUserId: string,
    input: {
      projectId?: string;
      title: string;
      description?: string;
      tag?: string;
      status?: string;
      assignedToUserId?: string;
    },
  ) {
    const [tagId, statusId, displayId] = await Promise.all([
      this.resolveEnum('module_type', input.tag),
      this.resolveEnum('project_status', input.status),
      this.sequences.nextDisplayId(tenantId, 'module'),
    ]);

    const module = await this.repository.create({
      projectId: input.projectId,
      tenantId,
      title: input.title,
      description: input.description,
      tagId,
      statusId,
      assignedToUserId: input.assignedToUserId,
      displayId,
    });

    if (!module) {
      throw new NotFoundException('Failed to create module');
    }

    const [shaped] = await this.withDisplayValues(
      tenantId,
      [module],
      callerUserId,
    );
    return shaped;
  }

  async update(
    tenantId: string,
    moduleId: string,
    callerUserId: string,
    input: Partial<{
      title: string;
      description: string;
      tag: string;
      status: string;
      assignedToUserId: string;
    }>,
  ) {
    await this.findOne(tenantId, moduleId, callerUserId);

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

    const [shaped] = await this.withDisplayValues(
      tenantId,
      [module],
      callerUserId,
    );
    return shaped;
  }

  async archive(tenantId: string, moduleId: string, callerUserId: string) {
    await this.findOne(tenantId, moduleId, callerUserId);

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

    const [shaped] = await this.withDisplayValues(
      tenantId,
      [module],
      callerUserId,
    );

    return {
      module: shaped,
      warning: `This module has been archived and will be permanently deleted in ${ARCHIVE_RETENTION_DAYS} days.`,
    };
  }

  private async withDisplayValues<
    T extends { id: string; tagId: string | null; statusId: string | null },
  >(tenantId: string, rows: T[], _callerUserId: string) {
    const enumIds = rows
      .flatMap((r) => [r.tagId, r.statusId])
      .filter((id): id is string => id !== null);
    const valuesById = await this.enumRepository.findValuesByIds(enumIds);

    return rows.map(({ tagId, statusId, ...rest }) => ({
      ...rest,
      tag: tagId ? (valuesById.get(tagId) ?? null) : null,
      status: statusId ? (valuesById.get(statusId) ?? null) : null,
    }));
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
