// apps/api/src/modules/module-pipeline-stages-pool/services/module-pipeline-stages-pool.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { PAPER_PIPELINE_STAGE_VALUES } from '../../enum/constants/paper-pipeline-stages';

@Injectable()
export class ModulePipelineStagesPoolService {
  constructor(private readonly repository: EnumRepository) {}

  async list(tenantId: string) {
    return this.repository.findEffectiveModuleStages(tenantId);
  }

  async updateVisibility(tenantId: string, value: string, hidden: boolean) {
    this.assertKnownStage(value);
    await this.repository.materializeTenantModuleStages(tenantId);
    return this.repository.setTenantModuleStageHidden(tenantId, value, hidden);
  }

  async reorder(tenantId: string, order: string[]) {
    this.assertValidOrder(order);
    await this.repository.materializeTenantModuleStages(tenantId);
    return this.repository.reorderTenantModuleStages(tenantId, order);
  }

  async reset(tenantId: string) {
    await this.repository.resetTenantModuleStages(tenantId);
    return this.repository.findEffectiveModuleStages(tenantId);
  }

  private assertKnownStage(value: string) {
    if (!(PAPER_PIPELINE_STAGE_VALUES as readonly string[]).includes(value)) {
      throw new BadRequestException(`Unknown pipeline stage "${value}"`);
    }
  }

  private assertValidOrder(order: string[]) {
    const expected = new Set<string>(PAPER_PIPELINE_STAGE_VALUES);
    const given = new Set(order);
    const isPermutation =
      order.length === PAPER_PIPELINE_STAGE_VALUES.length &&
      given.size === expected.size &&
      [...given].every((value) => expected.has(value));
    if (!isPermutation) {
      throw new BadRequestException(
        'order must contain each pipeline stage exactly once',
      );
    }
  }
}
