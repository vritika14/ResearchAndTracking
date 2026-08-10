import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from '../services/workspaces.service';
import { UsersService } from '../../users/users.service';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;
  let workspacesService: {
    createWorkspace: jest.Mock;
    getCurrentWorkspace: jest.Mock;
  };
  let usersService: { findOrProvisionFromAccessToken: jest.Mock };

  beforeEach(async () => {
    workspacesService = {
      createWorkspace: jest.fn(),
      getCurrentWorkspace: jest.fn(),
    };
    usersService = {
      findOrProvisionFromAccessToken: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    controller = moduleRef.get<WorkspacesController>(WorkspacesController);
  });

  describe('create', () => {
    it('resolves the caller and delegates to the service', async () => {
      usersService.findOrProvisionFromAccessToken.mockResolvedValue({ id: 'user-1' });
      workspacesService.createWorkspace.mockResolvedValue({ id: 'tenant-1', name: 'New Co' });

      const req = { user: { sub: 'cognito-sub-1', accessToken: 'token-1' } } as any;
      const dto = { name: 'New Co' };

      const result = await controller.create(req, dto as any);

      expect(usersService.findOrProvisionFromAccessToken).toHaveBeenCalledWith(
        'cognito-sub-1',
        'token-1',
      );
      expect(workspacesService.createWorkspace).toHaveBeenCalledWith('user-1', 'New Co');
      expect(result).toEqual({ id: 'tenant-1', name: 'New Co' });
    });

    it('throws NotFoundException if the user could not be found or provisioned', async () => {
      usersService.findOrProvisionFromAccessToken.mockResolvedValue(undefined);

      const req = { user: { sub: 'cognito-sub-2', accessToken: 'token-2' } } as any;
      const dto = { name: 'New Co' };

      await expect(controller.create(req, dto as any)).rejects.toThrow(NotFoundException);
      expect(workspacesService.createWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('getCurrent', () => {
    it('resolves the caller and delegates to the service', async () => {
      usersService.findOrProvisionFromAccessToken.mockResolvedValue({ id: 'user-1' });
      workspacesService.getCurrentWorkspace.mockResolvedValue({ id: 'tenant-1' });

      const req = { user: { sub: 'cognito-sub-1', accessToken: 'token-1' } } as any;

      const result = await controller.getCurrent(req);

      expect(workspacesService.getCurrentWorkspace).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ id: 'tenant-1' });
    });

    it('throws NotFoundException if the user could not be found or provisioned', async () => {
      usersService.findOrProvisionFromAccessToken.mockResolvedValue(undefined);

      const req = { user: { sub: 'cognito-sub-2', accessToken: 'token-2' } } as any;

      await expect(controller.getCurrent(req)).rejects.toThrow(NotFoundException);
      expect(workspacesService.getCurrentWorkspace).not.toHaveBeenCalled();
    });
  });
});
