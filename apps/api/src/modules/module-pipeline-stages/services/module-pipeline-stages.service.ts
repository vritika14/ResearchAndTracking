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
    const { baseStages, customStages } = await this.repository.findPipelineStagesForModule(moduleId);
    const customValues = new Set(customStages.map((s) => s.value));
    const filteredBaseStages = baseStages.filter((s) => !customValues.has(s.value));
    return [...filteredBaseStages, ...customStages];
  }

  async create(moduleId: string, value: string, sortOrder: number) {
    try {
      const row = await this.repository.createModulePipelineStage(
        moduleId,
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
      if (causeMessage.includes('enum_module_category_value_key')) {
        throw new ConflictException(`A pipeline stage named "${value}" already exists for this module`);
      }
      throw err;
    }
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
