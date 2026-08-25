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
    return this.repository.findPipelineStagesForProject(projectId);
  }

  async create(projectId: string, value: string, sortOrder: number) {
    const row = await this.repository.createProjectPipelineStage(
      projectId,
      value,
      sortOrder,
    );
    if (!row) {
      throw new ConflictException('Failed to create pipeline stage');
    }
    return row;
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
