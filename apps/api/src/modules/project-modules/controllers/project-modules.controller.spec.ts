// apps/api/src/modules/project-modules/controllers/project-modules.controller.spec.ts
import { ProjectModulesController } from './project-modules.controller';
import { ProjectModulesService } from '../services/project-modules.service';

describe('ProjectModulesController', () => {
  let controller: ProjectModulesController;
  let modulesService: {
    listActive: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
  };

  beforeEach(() => {
    modulesService = {
      listActive: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
    };
    controller = new ProjectModulesController(modulesService as unknown as ProjectModulesService);
  });

  describe('list', () => {
    it('delegates to the service with tenantId and projectId', async () => {
      const modules = [{ id: 'm1' }];
      modulesService.listActive.mockResolvedValue(modules);

      const result = await controller.list('tenant-1', 'project-1');

      expect(modulesService.listActive).toHaveBeenCalledWith('tenant-1', 'project-1');
      expect(result).toBe(modules);
    });
  });

  describe('findOne', () => {
    it('delegates to the service with tenantId and moduleId', async () => {
      modulesService.findOne.mockResolvedValue({ id: 'm1' });

      const result = await controller.findOne('tenant-1', 'm1');

      expect(modulesService.findOne).toHaveBeenCalledWith('tenant-1', 'm1');
      expect(result).toEqual({ id: 'm1' });
    });
  });

  describe('create', () => {
    it('delegates to the service with projectId, tenantId, and dto', async () => {
      modulesService.create.mockResolvedValue({ id: 'm1' });
      const dto = { title: 'New Module' };

      const result = await controller.create('tenant-1', 'project-1', dto as any);

      expect(modulesService.create).toHaveBeenCalledWith('project-1', 'tenant-1', dto);
      expect(result).toEqual({ id: 'm1' });
    });
  });

  describe('update', () => {
    it('delegates to the service with tenantId, moduleId, and dto', async () => {
      modulesService.update.mockResolvedValue({ id: 'm1', title: 'Updated' });
      const dto = { title: 'Updated' };

      const result = await controller.update('tenant-1', 'm1', dto as any);

      expect(modulesService.update).toHaveBeenCalledWith('tenant-1', 'm1', dto);
      expect(result).toEqual({ id: 'm1', title: 'Updated' });
    });
  });

  describe('archive', () => {
    it('delegates to the service with tenantId and moduleId', async () => {
      modulesService.archive.mockResolvedValue({ module: { id: 'm1' }, warning: '14 days' });

      const result = await controller.archive('tenant-1', 'm1');

      expect(modulesService.archive).toHaveBeenCalledWith('tenant-1', 'm1');
      expect(result.warning).toBe('14 days');
    });
  });
});
