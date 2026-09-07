import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repository: {
    create: jest.Mock;
    countsByName: jest.Mock;
    dailyTotals: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue({ id: 'event-1' }),
      countsByName: jest.fn().mockResolvedValue([]),
      dailyTotals: jest.fn().mockResolvedValue([]),
    };

    service = new AnalyticsService(
      repository as unknown as AnalyticsRepository,
    );
  });

  describe('recordEvent', () => {
    it('stores the event under the caller and tenant', async () => {
      await service.recordEvent('tenant-1', 'user-1', {
        name: 'project_created',
        path: '/projects',
        properties: { projectId: 'p1' },
      });

      expect(repository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'project_created',
        path: '/projects',
        properties: { projectId: 'p1' },
      });
    });
  });

  describe('summary', () => {
    it('defaults to a 30-day window', async () => {
      await service.summary('tenant-1');

      const [, since] = repository.countsByName.mock.calls[0];
      const expected = new Date();
      expected.setDate(expected.getDate() - 30);
      expect(since.toDateString()).toBe(expected.toDateString());
    });

    it('clamps an excessive window to 90 days', async () => {
      await service.summary('tenant-1', 365);

      const [, since] = repository.countsByName.mock.calls[0];
      const expected = new Date();
      expected.setDate(expected.getDate() - 90);
      expect(since.toDateString()).toBe(expected.toDateString());
    });

    it('sums per-name counts into a total', async () => {
      repository.countsByName.mockResolvedValue([
        { name: 'page_view', count: 5 },
        { name: 'project_created', count: 2 },
      ]);

      const result = await service.summary('tenant-1', 7);

      expect(result.totalEvents).toBe(7);
      expect(result.windowDays).toBe(7);
    });
  });
});
