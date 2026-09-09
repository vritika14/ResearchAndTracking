import { ModulePipelineStagesPoolController } from './module-pipeline-stages-pool.controller';
import { ModulePipelineStagesPoolService } from '../services/module-pipeline-stages-pool.service';

describe('ModulePipelineStagesPoolController', () => {
  let controller: ModulePipelineStagesPoolController;
  let service: {
    list: jest.Mock;
    updateVisibility: jest.Mock;
    reorder: jest.Mock;
    reset: jest.Mock;
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      updateVisibility: jest.fn(),
      reorder: jest.fn(),
      reset: jest.fn(),
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

  it("updates a stage's visibility", async () => {
    service.updateVisibility.mockResolvedValue({
      value: 'Lit Review',
      hidden: true,
    });

    const result = await controller.updateVisibility('tenant-1', {
      value: 'Lit Review',
      hidden: true,
    });

    expect(service.updateVisibility).toHaveBeenCalledWith(
      'tenant-1',
      'Lit Review',
      true,
    );
    expect(result).toEqual({ value: 'Lit Review', hidden: true });
  });

  it('reorders stages', async () => {
    service.reorder.mockResolvedValue([{ value: 'Complete', sortOrder: 1 }]);

    const result = await controller.reorder('tenant-1', {
      order: ['Complete'],
    });

    expect(service.reorder).toHaveBeenCalledWith('tenant-1', ['Complete']);
    expect(result).toEqual([{ value: 'Complete', sortOrder: 1 }]);
  });

  it('resets to defaults', async () => {
    service.reset.mockResolvedValue([{ value: 'Concept, Ideation' }]);

    const result = await controller.reset('tenant-1');

    expect(service.reset).toHaveBeenCalledWith('tenant-1');
    expect(result).toEqual([{ value: 'Concept, Ideation' }]);
  });
});
