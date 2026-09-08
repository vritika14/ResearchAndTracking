import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from '../services/memberships.service';
import { MembershipsRepository } from '../repositories/memberships.repository';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';

describe('MembershipsController', () => {
  let controller: MembershipsController;
  let membershipsService: {
    listMembers: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    membershipsService = {
      listMembers: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue(20),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MembershipsController],
      providers: [
        {
          provide: MembershipsService,
          useValue: membershipsService,
        },
        {
          provide: MembershipsRepository,
          useValue: {},
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    controller = moduleRef.get<MembershipsController>(MembershipsController);
  });

  describe('listMembers', () => {
    it('delegates with the tenant and pagination parameters', async () => {
      const response = {
        data: [{ id: 'm1' }, { id: 'm2' }],
        meta: {
          page: 2,
          pageSize: 20,
          totalItems: 22,
          totalPages: 2,
        },
      };

      membershipsService.listMembers.mockResolvedValue(response);

      const result = await controller.listMembers('tenant-1', { page: 2 });

      expect(configService.get).toHaveBeenCalledWith('PAGE_SIZE', 20);

      expect(membershipsService.listMembers).toHaveBeenCalledWith(
        'tenant-1',
        2,
        20,
      );

      expect(result).toBe(response);
    });
  });
});
