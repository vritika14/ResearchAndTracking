import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectsRepository } from '../repositories/projects.repository';

const ARCHIVE_RETENTION_DAYS = 14;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly repository: ProjectsRepository,
    private readonly enumRepository: EnumRepository,
  ) {}

  async listActive(tenantId: string) {
    return this.repository.findActiveByTenant(tenantId);
  }

  async findOne(tenantId: string, projectId: string) {
    const project = await this.repository.findById(tenantId, projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
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
    const [statusId, pipelineStageId, importanceId] = await Promise.all([
      this.resolveEnum('project_status', input.status),
      this.resolveEnum('pipeline_stage', input.pipelineStage),
      this.resolveEnum('importance', input.importance),
    ]);

    return this.repository.create({
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
    });
  }

  async update(
    tenantId: string,
    projectId: string,
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
    await this.findOne(tenantId, projectId);

    const [statusId, pipelineStageId, importanceId] = await Promise.all([
      input.status ? this.resolveEnum('project_status', input.status) : undefined,
      input.pipelineStage ? this.resolveEnum('pipeline_stage', input.pipelineStage) : undefined,
      input.importance ? this.resolveEnum('importance', input.importance) : undefined,
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
    return project;
  }

  async archive(tenantId: string, projectId: string) {
    await this.findOne(tenantId, projectId);
  
    const archivedStatusId = await this.resolveEnum('project_status', 'Archived');
    if (!archivedStatusId) {
      throw new NotFoundException('Archived status is not configured in the enum table');
    }
  
    const project = await this.repository.archive(tenantId, projectId, archivedStatusId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  
    return {
      project,
      warning: `This project has been archived and will be permanently deleted in ${ARCHIVE_RETENTION_DAYS} days.`,
    };
  }
  
  
  

  private async resolveEnum(category: string, value?: string): Promise<string | undefined> {
    if (!value) return undefined;
    const match = await this.enumRepository.findByCategoryAndValue(category, value);
    if (!match) {
      throw new NotFoundException(`Unknown ${category} value: "${value}"`);
    }
    return match.id;
  }
}
