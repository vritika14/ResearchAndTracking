// apps/api/src/modules/pipeline-stages/services/pipeline-stages.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';

@Injectable()
export class PipelineStagesService {
  constructor(private readonly repository: EnumRepository) {}

  async list(tenantId: string) {
    return this.repository.findPipelineStagesForTenant(tenantId);
  }

  async create(tenantId: string, value: string, sortOrder: number) {
    const row = await this.repository.createTenantPipelineStage(
      tenantId,
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
      id,
      values,
    );
    if (!row) {
      throw new NotFoundException(
        'Pipeline stage not found, or not owned by this workspace',
      );
    }
    return row;
  }

  async remove(tenantId: string, id: string) {
    const row = await this.repository.deleteTenantPipelineStage(tenantId, id);
    if (!row) {
      throw new NotFoundException(
        'Pipeline stage not found, or not owned by this workspace',
      );
    }
    return row;
  }
}
