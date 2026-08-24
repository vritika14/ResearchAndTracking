import { Injectable, NotFoundException } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectCollaboratorsRepository } from '../../project-collaborators/repositories/project-collaborators.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';
import { ProjectsRepository } from '../repositories/projects.repository';

const ARCHIVE_RETENTION_DAYS = 14;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly repository: ProjectsRepository,
    private readonly enumRepository: EnumRepository,
    private readonly collaboratorsRepository: ProjectCollaboratorsRepository,
    private readonly sequences: TenantSequencesRepository,
  ) {}

  async listActive(tenantId: string, callerUserId: string) {
    const rows = await this.repository.findActiveByTenant(tenantId);
    const shaped = await this.withDisplayValues(rows, callerUserId);
    return shaped.filter(
      (project, index) =>
        project.role !== null || rows[index]!.userId === callerUserId,
    );
  }

  /**
   * Visible only to the project's owner or a project_collaborators row for
   * the caller — a tenant member with neither is treated as if the project
   * doesn't exist, not merely forbidden, so its existence isn't leaked.
   */
  async findOne(tenantId: string, projectId: string, callerUserId: string) {
    const project = await this.repository.findById(tenantId, projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const [shaped] = await this.withDisplayValues([project], callerUserId);
    if (shaped!.role === null && project.userId !== callerUserId) {
      throw new NotFoundException('Project not found');
    }
    return shaped;
  }

  /**
   * Tenant-agnostic: every project the caller owns or collaborates on,
   * regardless of which workspace it lives in. The owner is always inserted
   * as a project_collaborators row at creation time, so a single query over
   * that table already covers both cases — mirrors TasksService.listForCaller.
   */
  async listForCaller(callerUserId: string) {
    const projectIds = await this.collaboratorsRepository.findProjectIdsByUser(
      callerUserId,
    );
    const rows = (await this.repository.findByIds(projectIds)).filter(
      (project) => project.archivedAt === null,
    );
    return this.withDisplayValues(rows, callerUserId);
  }

  /** Tenant-agnostic single-project fetch — see listForCaller. */
  async findOneForCaller(projectId: string, callerUserId: string) {
    const project = await this.repository.findByIdGlobal(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.findOne(project.tenantId, projectId, callerUserId);
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
    const [statusId, pipelineStageId, importanceId, ownerRoleId, displayId] =
      await Promise.all([
        this.resolveEnum('project_status', input.status),
        this.resolveEnum('project_pipeline_stage', input.pipelineStage),
        this.resolveEnum('importance', input.importance),
        this.resolveEnum('project_role', 'Owner'),
        this.sequences.nextDisplayId(tenantId, 'project'),
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
        displayId,
      },
      ownerRoleId,
    );

    if (!project) {
      throw new NotFoundException('Failed to create project');
    }

    const [shaped] = await this.withDisplayValues([project], userId);
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
        ? this.resolveEnum('project_pipeline_stage', input.pipelineStage)
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

    const [shaped] = await this.withDisplayValues([project], callerUserId);
    return shaped;
  }

  /** Tenant-agnostic update — resolves the project's real tenant first, then
   * delegates to the normal (still access-checked) update flow. */
  async updateForCaller(
    projectId: string,
    callerUserId: string,
    input: Parameters<ProjectsService['update']>[3],
  ) {
    const project = await this.repository.findByIdGlobal(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.update(project.tenantId, projectId, callerUserId, input);
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

    const [shaped] = await this.withDisplayValues([project], callerUserId);

    return {
      project: shaped,
      warning: `This project has been archived and will be permanently deleted in ${ARCHIVE_RETENTION_DAYS} days.`,
    };
  }

  /** Tenant-agnostic archive — see updateForCaller. */
  async archiveForCaller(projectId: string, callerUserId: string) {
    const project = await this.repository.findByIdGlobal(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.archive(project.tenantId, projectId, callerUserId);
  }

  private async withDisplayValues<
    T extends {
      id: string;
      tenantId: string;
      statusId: string | null;
      pipelineStageId: string | null;
      importanceId: string | null;
    },
  >(rows: T[], callerUserId: string) {
    const enumIds = rows
      .flatMap((r) => [r.statusId, r.pipelineStageId, r.importanceId])
      .filter((id): id is string => id !== null);

    const [valuesById, roleRows] = await Promise.all([
      this.enumRepository.findValuesByIds(enumIds),
      Promise.all(
        rows.map((r) =>
          this.collaboratorsRepository.findByProjectAndUser(
            r.tenantId,
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
