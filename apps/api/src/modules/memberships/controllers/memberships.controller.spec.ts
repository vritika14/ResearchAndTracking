import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from '../services/memberships.service';
import { MembershipsRepository } from '../repositories/memberships.repository';
import { UsersService } from '../../users/users.service';

describe('MembershipsController', () => {
  let controller: MembershipsController;
  let membershipsService: {
    listMembers: jest.Mock;
  };

  beforeEach(async () => {
    membershipsService = {
      listMembers: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MembershipsController],
      providers: [
        { provide: MembershipsService, useValue: membershipsService },
        { provide: MembershipsRepository, useValue: {} },
        { provide: UsersService, useValue: {} },
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
});
