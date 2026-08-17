import { ProjectsController } from './projects.controller';
import { ProjectsService } from '../services/projects.service';
import { UsersService } from '../../users/users.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let projectsService: {
    listActive: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
  };
  let usersService: { findByExternalAuthId: jest.Mock };

  beforeEach(() => {
    projectsService = {
      listActive: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
    };
    usersService = { findByExternalAuthId: jest.fn().mockResolvedValue({ id: 'user-1' }) };

    controller = new ProjectsController(
      projectsService as unknown as ProjectsService,
      usersService as unknown as UsersService,
    );
  });

  const req = { user: { sub: 'cognito-sub-1', accessToken: 'token-1' } } as any;

  describe('list', () => {
    it('resolves the caller and delegates to the service', async () => {
      const projects = [{ id: 'p1' }];
      projectsService.listActive.mockResolvedValue(projects);

      const result = await controller.list('tenant-1', req);

      expect(projectsService.listActive).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(result).toBe(projects);
    });
  });

  describe('findOne', () => {
    it('resolves the caller and delegates to the service', async () => {
      projectsService.findOne.mockResolvedValue({ id: 'p1' });

      const result = await controller.findOne('tenant-1', 'p1', req);

      expect(projectsService.findOne).toHaveBeenCalledWith('tenant-1', 'p1', 'user-1');
      expect(result).toEqual({ id: 'p1' });
    });
  });

  describe('create', () => {
    it('resolves the caller and delegates to the service', async () => {
      projectsService.create.mockResolvedValue({ id: 'p1' });
      const dto = { title: 'New Project' };

      const result = await controller.create('tenant-1', req, dto as any);

      expect(usersService.findByExternalAuthId).toHaveBeenCalledWith('cognito-sub-1');
      expect(projectsService.create).toHaveBeenCalledWith('user-1', 'tenant-1', dto);
      expect(result).toEqual({ id: 'p1' });
    });
  });

  describe('update', () => {
    it('resolves the caller and delegates to the service', async () => {
      projectsService.update.mockResolvedValue({ id: 'p1', title: 'Updated' });
      const dto = { title: 'Updated' };

      const result = await controller.update('tenant-1', 'p1', req, dto as any);

      expect(projectsService.update).toHaveBeenCalledWith('tenant-1', 'p1', 'user-1', dto);
      expect(result).toEqual({ id: 'p1', title: 'Updated' });
    });
  });

  describe('archive', () => {
    it('resolves the caller and delegates to the service', async () => {
      projectsService.archive.mockResolvedValue({ project: { id: 'p1' }, warning: '14 days' });

      const result = await controller.archive('tenant-1', 'p1', req);

      expect(projectsService.archive).toHaveBeenCalledWith('tenant-1', 'p1', 'user-1');
      expect(result.warning).toBe('14 days');
    });
  });
});
