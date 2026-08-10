import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from '../services/memberships.service';
import { UsersService } from '../../users/users.service';
import { MembershipsRepository } from '../repositories/memberships.repository';

describe('MembershipsController', () => {
  let controller: MembershipsController;
  let membershipsService: {
    listMembers: jest.Mock;
    inviteMember: jest.Mock;
    revokeMember: jest.Mock;
  };
  let usersService: { findByExternalAuthId: jest.Mock };

  beforeEach(async () => {
    membershipsService = {
      listMembers: jest.fn(),
      inviteMember: jest.fn(),
      revokeMember: jest.fn(),
    };
    usersService = {
      findByExternalAuthId: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MembershipsController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: MembershipsService, useValue: membershipsService },
        { provide: MembershipsRepository, useValue: {} },
      ],
    }).compile();

    controller = moduleRef.get<MembershipsController>(MembershipsController);
  });

  describe('listMembers', () => {
    it('delegates to the service with the tenantId', async () => {
      const members = [{ id: 'm1' }, { id: 'm2' }];
      membershipsService.listMembers.mockResolvedValue(members);

      const result = await controller.listMembers('tenant-1');

      expect(membershipsService.listMembers).toHaveBeenCalledWith('tenant-1');
      expect(result).toBe(members);
    });
  });

  describe('inviteMember', () => {
    it('resolves the caller and delegates to the service without a role field', async () => {
      usersService.findByExternalAuthId.mockResolvedValue({
        id: 'inviter-user-id',
      });
      membershipsService.inviteMember.mockResolvedValue({
        invitation: { id: 'invitation-1' },
        acceptanceToken: 'raw-token',
      });

      const req = {
        user: { sub: 'cognito-sub-1', accessToken: 'token-1' },
      } as any;
      const dto = { email: 'new@example.com' };

      const result = await controller.inviteMember('tenant-1', req, dto);

      expect(usersService.findByExternalAuthId).toHaveBeenCalledWith(
        'cognito-sub-1',
      );
      expect(membershipsService.inviteMember).toHaveBeenCalledWith(
        'tenant-1',
        'inviter-user-id',
        'new@example.com',
      );
      expect(result).toEqual({
        invitation: { id: 'invitation-1' },
        acceptanceToken: 'raw-token',
      });
    });
  });

  describe('revokeMember', () => {
    it('delegates to the service with tenantId and membershipId', async () => {
      membershipsService.revokeMember.mockResolvedValue({
        id: 'm1',
        status: 'revoked',
      });

      const result = await controller.revokeMember('tenant-1', 'membership-1');

      expect(membershipsService.revokeMember).toHaveBeenCalledWith(
        'tenant-1',
        'membership-1',
      );
      expect(result).toEqual({ id: 'm1', status: 'revoked' });
    });
  });
});
