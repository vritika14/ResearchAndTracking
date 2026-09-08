import { FeedbackService } from './feedback.service';
import { FeedbackRepository } from '../repositories/feedback.repository';

describe('FeedbackService', () => {
  let service: FeedbackService;

  let repository: {
    findPageByUser: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findPageByUser: jest.fn(),
    };

    service = new FeedbackService(repository as unknown as FeedbackRepository);
  });

  describe('list', () => {
    it('returns a paginated list of feedback submitted by the caller', async () => {
      const feedback = [
        {
          id: 'feedback-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          message: 'Helpful application',
          rating: 5,
        },
      ];

      repository.findPageByUser.mockResolvedValue({
        data: feedback,
        totalItems: 45,
      });

      const result = await service.list('tenant-1', 'user-1', 2, 20);

      expect(repository.findPageByUser).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        20,
        20,
      );

      expect(result).toEqual({
        data: feedback,
        meta: {
          page: 2,
          pageSize: 20,
          totalItems: 45,
          totalPages: 3,
        },
      });
    });
  });
});
