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
    const { baseStages, customStages } =
      await this.repository.findPipelineStagesForProject(projectId);
    // Projects created with an explicit stage selection store ordered,
    // project-scoped copies of those stages. In that case the copies are the
    // complete pipeline; merging defaults back in would reintroduce stages the
    // user deliberately left out during project creation. Older projects that
    // predate stage selection continue to use the default pipeline.
    return customStages.length > 0 ? customStages : baseStages;
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
      const causeMessage =
        err instanceof Error && 'cause' in err && err.cause instanceof Error
          ? err.cause.message
          : '';
      if (causeMessage.includes('enum_project_category_value_key')) {
        throw new ConflictException(
          `A pipeline stage named "${value}" already exists for this project`,
        );
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
