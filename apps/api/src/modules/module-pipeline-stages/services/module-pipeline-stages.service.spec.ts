import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ModulePipelineStagesService } from './module-pipeline-stages.service';

describe('ModulePipelineStagesService', () => {
  const repository = {
    findPipelineStagesForModule: jest.fn(),
  };
  const service = new ModulePipelineStagesService(
    repository as unknown as EnumRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns only the stages explicitly selected for a module', async () => {
    repository.findPipelineStagesForModule.mockResolvedValue({
      baseStages: [
        { id: 'base-1', value: 'Concept', sortOrder: 1 },
        { id: 'base-2', value: 'Analysis', sortOrder: 2 },
        { id: 'base-3', value: 'Publication', sortOrder: 3 },
      ],
      customStages: [
        { id: 'selected-1', value: 'Concept', sortOrder: 1 },
        { id: 'selected-2', value: 'Publication', sortOrder: 2 },
      ],
    });

    await expect(service.list('module-1')).resolves.toEqual([
      { id: 'selected-1', value: 'Concept', sortOrder: 1 },
      { id: 'selected-2', value: 'Publication', sortOrder: 2 },
    ]);
  });

  it('keeps the default pipeline for modules created before stage selection', async () => {
    const baseStages = [{ id: 'base-1', value: 'Concept', sortOrder: 1 }];
    repository.findPipelineStagesForModule.mockResolvedValue({
      baseStages,
      customStages: [],
    });

    await expect(service.list('legacy-module')).resolves.toEqual(baseStages);
  });
});
