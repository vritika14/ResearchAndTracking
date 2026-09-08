import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConferencesService } from './conferences.service';
import { ConferencesRepository } from '../repositories/conferences.repository';

describe('ConferencesService', () => {
  let service: ConferencesService;
  let repository: {
    findProjectsByIds: jest.Mock;
    findOwnedProjectIds: jest.Mock;
    findLinkedProjects: jest.Mock;
    findVisibleById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  const tenantId = 'tenant-1';
  const callerUserId = 'user-1';

  beforeEach(() => {
    repository = {
      findProjectsByIds: jest.fn(),
      findOwnedProjectIds: jest.fn(),
      findLinkedProjects: jest.fn().mockResolvedValue([]),
      findVisibleById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    service = new ConferencesService(
      repository as unknown as ConferencesRepository,
    );
  });

  const baseInput = {
    acronym: 'ASM',
    name: 'Conference',
    location: 'Sydney',
    submissionDue: '2026-08-01',
    startDate: '2027-06-04',
    endDate: '2027-06-08',
  };

  describe('create', () => {
    it('creates a conference with no linked projects without validating ownership', async () => {
      repository.create.mockResolvedValue({ id: 'conference-1' });

      await service.create(tenantId, callerUserId, {
        ...baseInput,
        projectIds: [],
      });

      expect(repository.findProjectsByIds).not.toHaveBeenCalled();
      expect(repository.findOwnedProjectIds).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, ownerUserId: callerUserId }),
        [],
      );
    });

    it('still requires ownership of every linked project when projects are supplied', async () => {
      repository.findProjectsByIds.mockResolvedValue([{ id: 'project-1' }]);
      repository.findOwnedProjectIds.mockResolvedValue([]);

      await expect(
        service.create(tenantId, callerUserId, {
          ...baseInput,
          projectIds: ['project-1'],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejects an end date before the start date regardless of linked projects', async () => {
      await expect(
        service.create(tenantId, callerUserId, {
          ...baseInput,
          startDate: '2027-06-08',
          endDate: '2027-06-04',
          projectIds: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('clears all linked projects when projectIds is updated to an empty array', async () => {
      repository.findVisibleById.mockResolvedValue({
        id: 'conference-1',
        ownerUserId: callerUserId,
        startDate: baseInput.startDate,
        endDate: baseInput.endDate,
      });
      repository.update.mockResolvedValue({ id: 'conference-1' });

      await service.update(tenantId, 'conference-1', callerUserId, {
        projectIds: [],
      });

      expect(repository.findProjectsByIds).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(
        tenantId,
        'conference-1',
        expect.any(Object),
        [],
      );
    });
  });
});
