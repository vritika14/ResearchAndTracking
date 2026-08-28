import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';

@Injectable()
export class ModulePipelineStagesService {
  constructor(private readonly repository: EnumRepository) {}

  async list(moduleId: string) {
    const { baseStages, customStages } =
      await this.repository.findPipelineStagesForModule(moduleId);
    return [...baseStages, ...customStages];
  }

  async create(moduleId: string, value: string, sortOrder: number) {
    const row = await this.repository.createModulePipelineStage(
      moduleId,
      value,
      sortOrder,
    );
    if (!row) {
      throw new ConflictException('Failed to create pipeline stage');
    }
    return row;
  }

  async update(
    moduleId: string,
    id: string,
    values: Partial<{ value: string; sortOrder: number }>,
  ) {
    const row = await this.repository.updateModulePipelineStage(
      moduleId,
      id,
      values,
    );
    if (!row) {
      throw new NotFoundException(
        'Pipeline stage not found, or not owned by this module',
      );
    }
    return row;
  }

  async remove(moduleId: string, id: string) {
    const row = await this.repository.deleteModulePipelineStage(moduleId, id);
    if (!row) {
      throw new NotFoundException(
        'Pipeline stage not found, or not owned by this module',
      );
    }
    return row;
  }
}
