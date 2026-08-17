import { Injectable, NotFoundException } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectCollaboratorsRepository } from '../../project-collaborators/repositories/project-collaborators.repository';
import { ProjectsRepository } from '../repositories/projects.repository';

const ARCHIVE_RETENTION_DAYS = 14;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly repository: ProjectsRepository,
    private readonly enumRepository: EnumRepository,
    private readonly collaboratorsRepository: ProjectCollaboratorsRepository,
  ) {}

  async listActive(tenantId: string, callerUserId: string) {
    const rows = await this.repository.findActiveByTenant(tenantId);
    return this.withDisplayValues(tenantId, rows, callerUserId);
  }

  async findOne(tenantId: string, projectId: string, callerUserId: string) {
    const project = await this.repository.findById(tenantId, projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const [shaped] = await this.withDisplayValues(
      tenantId,
      [project],
      callerUserId,
    );
    return shaped;
  }

  async create(
    userId: string,
    tenantId: string,
    input: {
      title: string;
      description?: string;
      researchArea?: string;
      status?: string;
      pipelineStage?: string;
      importance?: string;
      scheduledFor?: string;
      dueDate?: string;
      totalBudget?: string;
      targetJournals?: string;
    },
  ) {
    const [statusId, pipelineStageId, importanceId, ownerRoleId] =
      await Promise.all([
        this.resolveEnum('project_status', input.status),
        this.resolveEnum('pipeline_stage', input.pipelineStage),
        this.resolveEnum('importance', input.importance),
        this.resolveEnum('project_role', 'Owner'),
      ]);

    if (!ownerRoleId) {
      throw new NotFoundException(
        'Owner role is not configured in the enum table',
      );
    }

    const project = await this.repository.create(
      {
        userId,
        tenantId,
        title: input.title,
        description: input.description,
        researchArea: input.researchArea,
        statusId,
        pipelineStageId,
        importanceId,
        scheduledFor: input.scheduledFor,
        dueDate: input.dueDate,
        totalBudget: input.totalBudget,
        targetJournals: input.targetJournals,
      },
      ownerRoleId,
    );

    if (!project) {
      throw new NotFoundException('Failed to create project');
    }

    const [shaped] = await this.withDisplayValues(tenantId, [project], userId);
    return shaped;
  }

  async update(
    tenantId: string,
    projectId: string,
    callerUserId: string,
    input: Partial<{
      title: string;
      description: string;
      researchArea: string;
      status: string;
      pipelineStage: string;
      importance: string;
      scheduledFor: string;
      dueDate: string;
      totalBudget: string;
      targetJournals: string;
    }>,
  ) {
    await this.findOne(tenantId, projectId, callerUserId);

    const [statusId, pipelineStageId, importanceId] = await Promise.all([
      input.status
        ? this.resolveEnum('project_status', input.status)
        : undefined,
      input.pipelineStage
        ? this.resolveEnum('pipeline_stage', input.pipelineStage)
        : undefined,
      input.importance
        ? this.resolveEnum('importance', input.importance)
        : undefined,
    ]);

    const project = await this.repository.update(tenantId, projectId, {
      title: input.title,
      description: input.description,
      researchArea: input.researchArea,
      statusId,
      pipelineStageId,
      importanceId,
      scheduledFor: input.scheduledFor,
      dueDate: input.dueDate,
      totalBudget: input.totalBudget,
      targetJournals: input.targetJournals,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const [shaped] = await this.withDisplayValues(
      tenantId,
      [project],
      callerUserId,
    );
    return shaped;
  }

  async archive(tenantId: string, projectId: string, callerUserId: string) {
    await this.findOne(tenantId, projectId, callerUserId);

    const archivedStatusId = await this.resolveEnum(
      'project_status',
      'Archived',
    );
    if (!archivedStatusId) {
      throw new NotFoundException(
        'Archived status is not configured in the enum table',
      );
    }

    const project = await this.repository.archive(
      tenantId,
      projectId,
      archivedStatusId,
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const [shaped] = await this.withDisplayValues(
      tenantId,
      [project],
      callerUserId,
    );

    return {
      project: shaped,
      warning: `This project has been archived and will be permanently deleted in ${ARCHIVE_RETENTION_DAYS} days.`,
    };
  }

  private async withDisplayValues<
    T extends {
      id: string;
      statusId: string | null;
      pipelineStageId: string | null;
      importanceId: string | null;
    },
  >(tenantId: string, rows: T[], callerUserId: string) {
    const enumIds = rows
      .flatMap((r) => [r.statusId, r.pipelineStageId, r.importanceId])
      .filter((id): id is string => id !== null);

    const [valuesById, roleRows] = await Promise.all([
      this.enumRepository.findValuesByIds(enumIds),
      Promise.all(
        rows.map((r) =>
          this.collaboratorsRepository.findByProjectAndUser(
            tenantId,
            r.id,
            callerUserId,
          ),
        ),
      ),
    ]);

    const roleIds = roleRows
      .map((r) => r?.roleId)
      .filter((id): id is string => !!id);
    const roleValuesById = await this.enumRepository.findValuesByIds(roleIds);

    return rows.map(
      ({ statusId, pipelineStageId, importanceId, ...rest }, index) => ({
        ...rest,
        status: statusId ? (valuesById.get(statusId) ?? null) : null,
        pipelineStage: pipelineStageId
          ? (valuesById.get(pipelineStageId) ?? null)
          : null,
        importance: importanceId
          ? (valuesById.get(importanceId) ?? null)
          : null,
        role: roleRows[index]?.roleId
          ? (roleValuesById.get(roleRows[index].roleId) ?? null)
          : null,
      }),
    );
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
