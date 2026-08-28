import { ConflictException, NotFoundException } from '@nestjs/common';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ModulePipelineStagesPoolService } from './module-pipeline-stages-pool.service';

describe('ModulePipelineStagesPoolService', () => {
  let service: ModulePipelineStagesPoolService;
  let repository: {
    findByCategory: jest.Mock;
    createTenantPipelineStage: jest.Mock;
    updateTenantPipelineStage: jest.Mock;
    deleteTenantPipelineStage: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findByCategory: jest.fn(),
      createTenantPipelineStage: jest.fn(),
      updateTenantPipelineStage: jest.fn(),
      deleteTenantPipelineStage: jest.fn(),
    };
    service = new ModulePipelineStagesPoolService(
      repository as unknown as EnumRepository,
    );
  });

  it('lists the tenant-scoped module pipeline stage pool', async () => {
    const stages = [{ id: 's1', value: 'Backlog' }];
    repository.findByCategory.mockResolvedValue(stages);

    const result = await service.list('tenant-1');

    expect(repository.findByCategory).toHaveBeenCalledWith(
      'module_pipeline_stage',
      'tenant-1',
    );
    expect(result).toBe(stages);
  });

  it('creates a custom stage scoped to the tenant', async () => {
    repository.createTenantPipelineStage.mockResolvedValue({ id: 's2' });

    await service.create('tenant-1', 'Testing', 3);

    expect(repository.createTenantPipelineStage).toHaveBeenCalledWith(
      'tenant-1',
      'module_pipeline_stage',
      'Testing',
      3,
    );
  });

  it('throws when creation fails to return a row', async () => {
    repository.createTenantPipelineStage.mockResolvedValue(undefined);

    await expect(service.create('tenant-1', 'Testing', 3)).rejects.toThrow(
      ConflictException,
    );
  });

  it('throws when updating a stage that is not owned by this tenant (e.g. a shared default)', async () => {
    repository.updateTenantPipelineStage.mockResolvedValue(undefined);

    await expect(
      service.update('tenant-1', 'default-stage-id', { value: 'Renamed' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when deleting a stage that is not owned by this tenant', async () => {
    repository.deleteTenantPipelineStage.mockResolvedValue(undefined);

    await expect(
      service.remove('tenant-1', 'default-stage-id'),
    ).rejects.toThrow(NotFoundException);
  });
});
