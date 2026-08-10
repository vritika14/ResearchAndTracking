import { ConflictException, NotFoundException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { DrizzleService } from '../../../db/drizzle.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let repository: {
    findByOwnerUserId: jest.Mock;
    findByMemberUserId: jest.Mock;
  };
  let drizzle: { db: { transaction: jest.Mock } };

  beforeEach(() => {
    repository = {
      findByOwnerUserId: jest.fn(),
      findByMemberUserId: jest.fn(),
    };
    drizzle = {
      db: {
        transaction: jest.fn(),
      },
    };

    service = new WorkspacesService(
      repository as unknown as WorkspacesRepository,
      drizzle as unknown as DrizzleService,
    );
  });

  describe('createWorkspace', () => {
    it('throws ConflictException if the user already owns a workspace', async () => {
      repository.findByOwnerUserId.mockResolvedValue({ id: 'existing-tenant' });

      await expect(
        service.createWorkspace('user-1', 'My Workspace'),
      ).rejects.toThrow(ConflictException);

      expect(drizzle.db.transaction).not.toHaveBeenCalled();
    });

    it('creates a tenant and owner membership transactionally when none exists', async () => {
      repository.findByOwnerUserId.mockResolvedValue(undefined);

      const mockTx = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 'new-tenant-id', name: 'My Workspace' }]),
      };

      drizzle.db.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
        return callback(mockTx);
      });

      const result = await service.createWorkspace('user-1', 'My Workspace');

      expect(drizzle.db.transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'new-tenant-id', name: 'My Workspace' });
    });
  });

  describe('getCurrentWorkspace', () => {
    it('throws NotFoundException if the user has no workspace', async () => {
      repository.findByMemberUserId.mockResolvedValue(undefined);

      await expect(service.getCurrentWorkspace('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the workspace when the user belongs to one', async () => {
      repository.findByMemberUserId.mockResolvedValue({ id: 'tenant-1', name: 'Existing' });

      const result = await service.getCurrentWorkspace('user-1');

      expect(result).toEqual({ id: 'tenant-1', name: 'Existing' });
    });
  });
});
