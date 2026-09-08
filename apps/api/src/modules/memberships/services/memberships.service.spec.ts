import { MembershipsService } from './memberships.service';
import { MembershipsRepository } from '../repositories/memberships.repository';

describe('MembershipsService', () => {
  let service: MembershipsService;

  let repository: {
    findActiveMembersPageByTenant: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findActiveMembersPageByTenant: jest.fn(),
    };

    service = new MembershipsService(
      repository as unknown as MembershipsRepository,
    );
  });

  describe('listMembers', () => {
    it('returns a paginated list of active tenant members', async () => {
      const members = [
        {
          id: 'membership-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          email: 'member@example.com',
          displayName: 'Example Member',
          role: 'member',
          status: 'active',
        },
      ];

      repository.findActiveMembersPageByTenant.mockResolvedValue({
        data: members,
        totalItems: 45,
      });

      const result = await service.listMembers('tenant-1', 2, 20);

      expect(repository.findActiveMembersPageByTenant).toHaveBeenCalledWith(
        'tenant-1',
        20,
        20,
      );

      expect(result).toEqual({
        data: members,
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
