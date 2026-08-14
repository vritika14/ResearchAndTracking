// apps/api/src/modules/projects/controllers/projects.controller.spec.ts
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
    usersService = { findByExternalAuthId: jest.fn() };

    controller = new ProjectsController(
      projectsService as unknown as ProjectsService,
      usersService as unknown as UsersService,
    );
  });

  describe('list', () => {
    it('delegates to the service with tenantId', async () => {
      const projects = [{ id: 'p1' }];
      projectsService.listActive.mockResolvedValue(projects);

      const result = await controller.list('tenant-1');

      expect(projectsService.listActive).toHaveBeenCalledWith('tenant-1');
      expect(result).toBe(projects);
    });
  });

  describe('findOne', () => {
    it('delegates to the service with tenantId and projectId', async () => {
      projectsService.findOne.mockResolvedValue({ id: 'p1' });

      const result = await controller.findOne('tenant-1', 'p1');

      expect(projectsService.findOne).toHaveBeenCalledWith('tenant-1', 'p1');
      expect(result).toEqual({ id: 'p1' });
    });
  });

  describe('create', () => {
    it('resolves the caller and delegates to the service', async () => {
      usersService.findByExternalAuthId.mockResolvedValue({ id: 'user-1' });
      projectsService.create.mockResolvedValue({ id: 'p1' });

      const req = {
        user: { sub: 'cognito-sub-1', accessToken: 'token-1' },
      } as any;
      const dto = { title: 'New Project' };

      const result = await controller.create('tenant-1', req, dto);

      expect(usersService.findByExternalAuthId).toHaveBeenCalledWith(
        'cognito-sub-1',
      );
      expect(projectsService.create).toHaveBeenCalledWith(
        'user-1',
        'tenant-1',
        dto,
      );
      expect(result).toEqual({ id: 'p1' });
    });
  });

  describe('update', () => {
    it('delegates to the service with tenantId, projectId, and dto', async () => {
      projectsService.update.mockResolvedValue({ id: 'p1', title: 'Updated' });
      const dto = { title: 'Updated' };

      const result = await controller.update('tenant-1', 'p1', dto);

      expect(projectsService.update).toHaveBeenCalledWith(
        'tenant-1',
        'p1',
        dto,
      );
      expect(result).toEqual({ id: 'p1', title: 'Updated' });
    });
  });

  describe('archive', () => {
    it('delegates to the service with tenantId and projectId', async () => {
      projectsService.archive.mockResolvedValue({
        project: { id: 'p1' },
        warning: '14 days',
      });

      const result = await controller.archive('tenant-1', 'p1');

      expect(projectsService.archive).toHaveBeenCalledWith('tenant-1', 'p1');
      expect(result.warning).toBe('14 days');
    });
  });
});
