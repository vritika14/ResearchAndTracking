import { ConferencesService } from './conferences.service';
import { ConferencesRepository } from '../repositories/conferences.repository';

describe('ConferencesService', () => {
  let service: ConferencesService;

  let repository: {
    findVisiblePageByUser: jest.Mock;
    findLinkedProjectsForConferences: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findVisiblePageByUser: jest.fn(),
      findLinkedProjectsForConferences: jest.fn(),
    };

    service = new ConferencesService(
      repository as unknown as ConferencesRepository,
    );
  });

  describe('list', () => {
    it('returns a paginated list of visible conferences', async () => {
      const conference = {
        id: 'conference-1',
        tenantId: 'tenant-1',
        acronym: 'CONF',
        name: 'Example Conference',
        location: 'Melbourne',
        submissionDue: '2026-10-01',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
      };

      const linkedProjects = [
        {
          id: 'project-1',
          title: 'Research Project',
        },
      ];

      repository.findVisiblePageByUser.mockResolvedValue({
        data: [conference],
        totalItems: 45,
      });

      repository.findLinkedProjectsForConferences.mockResolvedValue(
        new Map([['conference-1', linkedProjects]]),
      );

      const result = await service.list('tenant-1', 'user-1', 2, 20);

      expect(repository.findVisiblePageByUser).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        20,
        20,
      );

      expect(repository.findLinkedProjectsForConferences).toHaveBeenCalledWith(
        'tenant-1',
        ['conference-1'],
      );

      expect(result.data).toEqual([
        expect.objectContaining({
          id: 'conference-1',
          projects: linkedProjects,
          daysRemaining: expect.any(Number),
        }),
      ]);

      expect(result.meta).toEqual({
        page: 2,
        pageSize: 20,
        totalItems: 45,
        totalPages: 3,
      });
    });
  });
});
