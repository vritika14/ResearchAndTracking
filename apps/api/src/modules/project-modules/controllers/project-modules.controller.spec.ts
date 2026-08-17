import { ProjectModulesController } from './project-modules.controller';
import { ProjectModulesService } from '../services/project-modules.service';
import { UsersService } from '../../users/users.service';

describe('ProjectModulesController', () => {
  let controller: ProjectModulesController;
  let modulesService: {
    listActive: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
  };
  let usersService: { findByExternalAuthId: jest.Mock };

  beforeEach(() => {
    modulesService = {
      listActive: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
    };
    usersService = { findByExternalAuthId: jest.fn().mockResolvedValue({ id: 'user-1' }) };

    controller = new ProjectModulesController(
      modulesService as unknown as ProjectModulesService,
      usersService as unknown as UsersService,
    );
  });

  const req = { user: { sub: 'cognito-sub-1', accessToken: 'token-1' } } as any;

  describe('list', () => {
    it('resolves the caller and delegates to the service', async () => {
      const modules = [{ id: 'm1' }];
      modulesService.listActive.mockResolvedValue(modules);

      const result = await controller.list('tenant-1', 'project-1', req);

      expect(modulesService.listActive).toHaveBeenCalledWith('tenant-1', 'project-1', 'user-1');
      expect(result).toBe(modules);
    });
  });

  describe('findOne', () => {
    it('resolves the caller and delegates to the service', async () => {
      modulesService.findOne.mockResolvedValue({ id: 'm1' });

      const result = await controller.findOne('tenant-1', 'm1', req);

      expect(modulesService.findOne).toHaveBeenCalledWith('tenant-1', 'm1', 'user-1');
      expect(result).toEqual({ id: 'm1' });
    });
  });

  describe('create', () => {
    it('resolves the caller and delegates to the service', async () => {
      modulesService.create.mockResolvedValue({ id: 'm1' });
      const dto = { title: 'New Module' };

      const result = await controller.create('tenant-1', 'project-1', req, dto as any);

      expect(modulesService.create).toHaveBeenCalledWith('project-1', 'tenant-1', 'user-1', dto);
      expect(result).toEqual({ id: 'm1' });
    });
  });

  describe('update', () => {
    it('resolves the caller and delegates to the service', async () => {
      modulesService.update.mockResolvedValue({ id: 'm1', title: 'Updated' });
      const dto = { title: 'Updated' };

      const result = await controller.update('tenant-1', 'm1', req, dto as any);

      expect(modulesService.update).toHaveBeenCalledWith('tenant-1', 'm1', 'user-1', dto);
      expect(result).toEqual({ id: 'm1', title: 'Updated' });
    });
  });

  describe('archive', () => {
    it('resolves the caller and delegates to the service', async () => {
      modulesService.archive.mockResolvedValue({ module: { id: 'm1' }, warning: '14 days' });

      const result = await controller.archive('tenant-1', 'm1', req);

      expect(modulesService.archive).toHaveBeenCalledWith('tenant-1', 'm1', 'user-1');
      expect(result.warning).toBe('14 days');
    });
  });
});
