import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { search: jest.Mock };

  beforeEach(() => {
    usersService = { search: jest.fn() };
    controller = new UsersController(usersService as unknown as UsersService);
  });

  describe('search', () => {
    it('delegates to UsersService.search with the query string', async () => {
      usersService.search.mockResolvedValue([
        { id: 'user-1', displayName: 'Ann Example', email: 'ann@example.com' },
      ]);

      const result = await controller.search({ q: 'ann' });

      expect(usersService.search).toHaveBeenCalledWith('ann');
      expect(result).toEqual([
        { id: 'user-1', displayName: 'Ann Example', email: 'ann@example.com' },
      ]);
    });
  });
});
