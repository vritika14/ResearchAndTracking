import { ModulePipelineStagesPoolController } from './module-pipeline-stages-pool.controller';
import { ModulePipelineStagesPoolService } from '../services/module-pipeline-stages-pool.service';

describe('ModulePipelineStagesPoolController', () => {
  let controller: ModulePipelineStagesPoolController;
  let service: {
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new ModulePipelineStagesPoolController(
      service as unknown as ModulePipelineStagesPoolService,
    );
  });

  it('lists stages for the tenant', async () => {
    const stages = [{ id: 's1' }];
    service.list.mockResolvedValue(stages);

    const result = await controller.list('tenant-1');

    expect(service.list).toHaveBeenCalledWith('tenant-1');
    expect(result).toBe(stages);
  });

  it('creates a stage with a default sortOrder of 0 when omitted', async () => {
    service.create.mockResolvedValue({ id: 's2' });

    await controller.create('tenant-1', { value: 'Testing' });

    expect(service.create).toHaveBeenCalledWith('tenant-1', 'Testing', 0);
  });

  it('updates a stage', async () => {
    service.update.mockResolvedValue({ id: 's1', value: 'Renamed' });

    const result = await controller.update('tenant-1', 's1', { value: 'Renamed' });

    expect(service.update).toHaveBeenCalledWith('tenant-1', 's1', {
      value: 'Renamed',
    });
    expect(result).toEqual({ id: 's1', value: 'Renamed' });
  });

  it('removes a stage', async () => {
    service.remove.mockResolvedValue({ id: 's1' });

    const result = await controller.remove('tenant-1', 's1');

    expect(service.remove).toHaveBeenCalledWith('tenant-1', 's1');
    expect(result).toEqual({ id: 's1' });
  });
});
