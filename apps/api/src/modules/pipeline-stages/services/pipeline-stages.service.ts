// apps/api/src/modules/pipeline-stages/services/pipeline-stages.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';

const CATEGORY = 'project_pipeline_stage';

@Injectable()
export class PipelineStagesService {
  constructor(private readonly repository: EnumRepository) {}

  async list(tenantId: string) {
    return this.repository.findByCategory(CATEGORY, tenantId);
  }

  async create(tenantId: string, value: string, sortOrder: number) {
    const row = await this.repository.createTenantPipelineStage(
      tenantId,
      CATEGORY,
      value,
      sortOrder,
    );
    if (!row) {
      throw new ConflictException('Failed to create pipeline stage');
    }
    return row;
  }

  async update(
    tenantId: string,
    id: string,
    values: Partial<{ value: string; sortOrder: number }>,
  ) {
    const row = await this.repository.updateTenantPipelineStage(
      tenantId,
      CATEGORY,
      id,
      values,
    );
    if (!row) {
      throw new NotFoundException(
        'Pipeline stage not found, or a shared default stage that cannot be edited',
      );
    }
    return row;
  }

  async remove(tenantId: string, id: string) {
    const row = await this.repository.deleteTenantPipelineStage(
      tenantId,
      CATEGORY,
      id,
    );
    if (!row) {
      throw new NotFoundException(
        'Pipeline stage not found, or a shared default stage that cannot be deleted',
      );
    }
    return row;
  }
}
