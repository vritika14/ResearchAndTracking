import { BadRequestException } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ModulePipelineStagesPoolService } from './module-pipeline-stages-pool.service';
import { PAPER_PIPELINE_STAGE_VALUES } from '../../enum/constants/paper-pipeline-stages';

describe('ModulePipelineStagesPoolService', () => {
  let service: ModulePipelineStagesPoolService;
  let repository: {
    findEffectiveModuleStages: jest.Mock;
    materializeTenantModuleStages: jest.Mock;
    setTenantModuleStageHidden: jest.Mock;
    reorderTenantModuleStages: jest.Mock;
    resetTenantModuleStages: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findEffectiveModuleStages: jest.fn(),
      materializeTenantModuleStages: jest.fn(),
      setTenantModuleStageHidden: jest.fn(),
      reorderTenantModuleStages: jest.fn(),
      resetTenantModuleStages: jest.fn(),
    };
    service = new ModulePipelineStagesPoolService(
      repository as unknown as EnumRepository,
    );
  });

  it('lists the workspace effective stages', async () => {
    const stages = [{ id: 's1', value: 'Lit Review' }];
    repository.findEffectiveModuleStages.mockResolvedValue(stages);

    const result = await service.list('tenant-1');

    expect(repository.findEffectiveModuleStages).toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(result).toBe(stages);
  });

  it('materializes the tenant copy before hiding a stage', async () => {
    repository.setTenantModuleStageHidden.mockResolvedValue({
      value: 'Lit Review',
      hidden: true,
    });

    await service.updateVisibility('tenant-1', 'Lit Review', true);

    expect(repository.materializeTenantModuleStages).toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(repository.setTenantModuleStageHidden).toHaveBeenCalledWith(
      'tenant-1',
      'Lit Review',
      true,
    );
  });

  it('rejects hiding a stage name that is not part of the fixed catalog', async () => {
    await expect(
      service.updateVisibility('tenant-1', 'Made Up Stage', true),
    ).rejects.toThrow(BadRequestException);
    expect(repository.materializeTenantModuleStages).not.toHaveBeenCalled();
  });

  it('reorders when given a full permutation of the fixed catalog', async () => {
    const shuffled = [...PAPER_PIPELINE_STAGE_VALUES].reverse();
    repository.reorderTenantModuleStages.mockResolvedValue([]);

    await service.reorder('tenant-1', shuffled);

    expect(repository.materializeTenantModuleStages).toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(repository.reorderTenantModuleStages).toHaveBeenCalledWith(
      'tenant-1',
      shuffled,
    );
  });

  it('rejects a reorder that is missing a stage', async () => {
    const incomplete = PAPER_PIPELINE_STAGE_VALUES.slice(1);

    await expect(service.reorder('tenant-1', incomplete)).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.reorderTenantModuleStages).not.toHaveBeenCalled();
  });

  it('rejects a reorder containing an unknown stage name', async () => {
    const withExtra = [...PAPER_PIPELINE_STAGE_VALUES.slice(1), 'Not Real'];

    await expect(service.reorder('tenant-1', withExtra)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('resets the tenant back to the global default', async () => {
    const defaults = [{ id: 'g1', value: 'Concept, Ideation' }];
    repository.findEffectiveModuleStages.mockResolvedValue(defaults);

    const result = await service.reset('tenant-1');

    expect(repository.resetTenantModuleStages).toHaveBeenCalledWith('tenant-1');
    expect(result).toBe(defaults);
  });
});
