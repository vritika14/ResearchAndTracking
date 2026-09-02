import { EnumRepository } from '../../enum/repositories/enum.repository';
import { ProjectPipelineStagesService } from './project-pipeline-stages.service';

describe('ProjectPipelineStagesService', () => {
  const repository = {
    findPipelineStagesForProject: jest.fn(),
  };
  const service = new ProjectPipelineStagesService(
    repository as unknown as EnumRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns only the stages explicitly selected for a project', async () => {
    repository.findPipelineStagesForProject.mockResolvedValue({
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

    await expect(service.list('project-1')).resolves.toEqual([
      { id: 'selected-1', value: 'Concept', sortOrder: 1 },
      { id: 'selected-2', value: 'Publication', sortOrder: 2 },
    ]);
  });

  it('keeps the default pipeline for projects created before stage selection', async () => {
    const baseStages = [{ id: 'base-1', value: 'Concept', sortOrder: 1 }];
    repository.findPipelineStagesForProject.mockResolvedValue({
      baseStages,
      customStages: [],
    });

    await expect(service.list('legacy-project')).resolves.toEqual(baseStages);
  });
});
