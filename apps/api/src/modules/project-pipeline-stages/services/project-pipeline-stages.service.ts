// apps/api/src/modules/project-pipeline-stages/services/project-pipeline-stages.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';

@Injectable()
export class ProjectPipelineStagesService {
  constructor(private readonly repository: EnumRepository) {}

  async list(projectId: string) {
    const { baseStages, customStages } = await this.repository.findPipelineStagesForProject(projectId);
    const customValues = new Set(customStages.map((s) => s.value));
    const filteredBaseStages = baseStages.filter((s) => !customValues.has(s.value));
    return [...filteredBaseStages, ...customStages];
  }

  async create(projectId: string, value: string, sortOrder: number) {
    try {
      const row = await this.repository.createProjectPipelineStage(
        projectId,
        value,
        sortOrder,
      );
      if (!row) {
        throw new ConflictException('Failed to create pipeline stage');
      }
      return row;
    } catch (err) {
      const causeMessage = err instanceof Error && 'cause' in err && err.cause instanceof Error
        ? err.cause.message
        : '';
      if (causeMessage.includes('enum_project_category_value_key')) {
        throw new ConflictException(`A pipeline stage named "${value}" already exists for this project`);
      }
      throw err;
    }
  }

  async update(
    projectId: string,
    id: string,
    values: Partial<{ value: string; sortOrder: number }>,
  ) {
    const row = await this.repository.updateProjectPipelineStage(
      projectId,
      id,
      values,
    );
    if (!row) {
      throw new NotFoundException(
        'Pipeline stage not found, or not owned by this project',
      );
    }
    return row;
  }

  async remove(projectId: string, id: string) {
    const row = await this.repository.deleteProjectPipelineStage(projectId, id);
    if (!row) {
      throw new NotFoundException(
        'Pipeline stage not found, or not owned by this project',
      );
    }
    return row;
  }
}
