// apps/api/src/users/me.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MeController } from './me.controller';
import { UsersService } from './users.service';

describe('MeController', () => {
  let controller: MeController;
  let usersService: { findOrProvisionByExternalAuthId: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findOrProvisionByExternalAuthId: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = moduleRef.get<MeController>(MeController);
  });

  describe('getMe', () => {
    it('returns the mapped user profile for an existing user', async () => {
      usersService.findOrProvisionByExternalAuthId.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'real@example.com',
        displayName: 'Real User',
        status: 'active',
        externalAuthId: 'cognito-sub-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = { user: { sub: 'cognito-sub-1' } } as any;
      const result = await controller.getMe(req);

      expect(usersService.findOrProvisionByExternalAuthId).toHaveBeenCalledWith(
        'cognito-sub-1',
      );
      expect(result).toEqual({
        id: 'user-uuid-1',
        email: 'real@example.com',
        displayName: 'Real User',
        status: 'active',
      });
    });

    it('provisions and returns a new user on first login', async () => {
      usersService.findOrProvisionByExternalAuthId.mockResolvedValue({
        id: 'user-uuid-2',
        email: 'cognito-sub-2@pending.local',
        displayName: 'New User',
        status: 'active',
        externalAuthId: 'cognito-sub-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = { user: { sub: 'cognito-sub-2' } } as any;
      const result = await controller.getMe(req);

      expect(result.email).toBe('cognito-sub-2@pending.local');
      expect(result.displayName).toBe('New User');
    });

    it('throws NotFoundException when the user could not be found or provisioned', async () => {
      usersService.findOrProvisionByExternalAuthId.mockResolvedValue(undefined);

      const req = { user: { sub: 'cognito-sub-3' } } as any;

      await expect(controller.getMe(req)).rejects.toThrow(NotFoundException);
    });
  });
});
