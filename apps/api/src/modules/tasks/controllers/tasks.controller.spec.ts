// apps/api/src/modules/tasks/controllers/tasks.controller.spec.ts
import { TasksController } from './tasks.controller';
import { TasksService } from '../services/tasks.service';
import { UsersService } from '../../users/users.service';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: {
    listByProject: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let usersService: { findByExternalAuthId: jest.Mock };

  beforeEach(() => {
    tasksService = {
      listByProject: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    usersService = { findByExternalAuthId: jest.fn() };

    controller = new TasksController(
      tasksService as unknown as TasksService,
      usersService as unknown as UsersService,
    );
  });

  describe('list', () => {
    it('delegates to the service with tenantId and projectId', async () => {
      const tasks = [{ id: 't1' }];
      tasksService.listByProject.mockResolvedValue(tasks);

      const result = await controller.list('tenant-1', 'project-1');

      expect(tasksService.listByProject).toHaveBeenCalledWith('tenant-1', 'project-1');
      expect(result).toBe(tasks);
    });
  });

  describe('findOne', () => {
    it('delegates to the service with tenantId and taskId', async () => {
      tasksService.findOne.mockResolvedValue({ id: 't1' });

      const result = await controller.findOne('tenant-1', 't1');

      expect(tasksService.findOne).toHaveBeenCalledWith('tenant-1', 't1');
      expect(result).toEqual({ id: 't1' });
    });
  });

  describe('create', () => {
    it('resolves the caller and delegates to the service', async () => {
      usersService.findByExternalAuthId.mockResolvedValue({ id: 'user-1' });
      tasksService.create.mockResolvedValue({ id: 't1' });

      const req = { user: { sub: 'cognito-sub-1', accessToken: 'token-1' } } as any;
      const dto = { title: 'New Task' };

      const result = await controller.create('tenant-1', 'project-1', req, dto as any);

      expect(usersService.findByExternalAuthId).toHaveBeenCalledWith('cognito-sub-1');
      expect(tasksService.create).toHaveBeenCalledWith('project-1', 'tenant-1', 'user-1', dto);
      expect(result).toEqual({ id: 't1' });
    });
  });

  describe('update', () => {
    it('delegates to the service with tenantId, taskId, and dto', async () => {
      tasksService.update.mockResolvedValue({ id: 't1', title: 'Updated' });
      const dto = { title: 'Updated' };

      const result = await controller.update('tenant-1', 't1', dto as any);

      expect(tasksService.update).toHaveBeenCalledWith('tenant-1', 't1', dto);
      expect(result).toEqual({ id: 't1', title: 'Updated' });
    });
  });

  describe('remove', () => {
    it('delegates to the service with tenantId and taskId', async () => {
      tasksService.delete.mockResolvedValue({ id: 't1' });

      const result = await controller.remove('tenant-1', 't1');

      expect(tasksService.delete).toHaveBeenCalledWith('tenant-1', 't1');
      expect(result).toEqual({ id: 't1' });
    });
  });
});
