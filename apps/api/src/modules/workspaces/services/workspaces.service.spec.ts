import { NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../../../db/drizzle.service';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let repository: {
    findAllByMemberUserId: jest.Mock;
    findCurrentByUserId: jest.Mock;
    findWorkspaceForMember: jest.Mock;
    setCurrentWorkspace: jest.Mock;
  };
  let drizzle: { db: { transaction: jest.Mock } };

  beforeEach(() => {
    repository = {
      findAllByMemberUserId: jest.fn(),
      findCurrentByUserId: jest.fn(),
      findWorkspaceForMember: jest.fn(),
      setCurrentWorkspace: jest.fn(),
    };
    drizzle = { db: { transaction: jest.fn() } };
    service = new WorkspacesService(
      repository as unknown as WorkspacesRepository,
      drizzle as unknown as DrizzleService,
    );
  });

  it('creates a workspace, owner membership, and current context transactionally', async () => {
    const tenant = { id: 'tenant-1', name: 'My Workspace' };
    let insertCall = 0;
    const tx = {
      insert: jest.fn().mockImplementation(() => {
        insertCall += 1;
        if (insertCall === 1) {
          return {
            values: () => ({ returning: () => Promise.resolve([tenant]) }),
          };
        }
        if (insertCall === 2) {
          return { values: () => Promise.resolve(undefined) };
        }
        return {
          values: () => ({
            onConflictDoUpdate: () => Promise.resolve(undefined),
          }),
        };
      }),
    };
    drizzle.db.transaction.mockImplementation(
      (callback: (value: typeof tx) => unknown) =>
        Promise.resolve(callback(tx)),
    );

    await expect(
      service.createWorkspace('user-1', 'My Workspace'),
    ).resolves.toEqual({ ...tenant, membershipRole: 'owner' });
    expect(tx.insert).toHaveBeenCalledTimes(3);
  });

  it('lists every active workspace available to the user', async () => {
    const available = [{ id: 'tenant-1' }, { id: 'tenant-2' }];
    repository.findAllByMemberUserId.mockResolvedValue(available);

    await expect(service.listWorkspaces('user-1')).resolves.toBe(available);
  });

  it('returns an existing persisted current workspace', async () => {
    const current = { id: 'tenant-2', name: 'Current' };
    repository.findCurrentByUserId.mockResolvedValue(current);

    await expect(service.getCurrentWorkspace('user-1')).resolves.toBe(current);
    expect(repository.findAllByMemberUserId).not.toHaveBeenCalled();
  });

  it('persists the first available workspace when no current context exists', async () => {
    const fallback = { id: 'tenant-1', name: 'Fallback' };
    repository.findCurrentByUserId.mockResolvedValue(undefined);
    repository.findAllByMemberUserId.mockResolvedValue([fallback]);

    await expect(service.getCurrentWorkspace('user-1')).resolves.toBe(fallback);
    expect(repository.setCurrentWorkspace).toHaveBeenCalledWith(
      'user-1',
      'tenant-1',
    );
  });

  it('rejects current workspace lookup when the user has no memberships', async () => {
    repository.findCurrentByUserId.mockResolvedValue(undefined);
    repository.findAllByMemberUserId.mockResolvedValue([]);

    await expect(service.getCurrentWorkspace('user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('switches only to a workspace available to the user', async () => {
    const target = { id: 'tenant-2', name: 'Target' };
    repository.findWorkspaceForMember.mockResolvedValue(target);

    await expect(
      service.switchCurrentWorkspace('user-1', 'tenant-2'),
    ).resolves.toBe(target);
    expect(repository.setCurrentWorkspace).toHaveBeenCalledWith(
      'user-1',
      'tenant-2',
    );
  });

  it('rejects switching to an unavailable workspace', async () => {
    repository.findWorkspaceForMember.mockResolvedValue(undefined);

    await expect(
      service.switchCurrentWorkspace('user-1', 'tenant-other'),
    ).rejects.toThrow(NotFoundException);
    expect(repository.setCurrentWorkspace).not.toHaveBeenCalled();
  });
});
