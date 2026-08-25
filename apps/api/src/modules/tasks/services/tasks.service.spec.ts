// apps/api/src/modules/tasks/services/tasks.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksRepository } from '../repositories/tasks.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';
import { TaskMembersRepository } from '../../task-members/repositories/task-members.repository';
import { ProjectModulesRepository } from '../../project-modules/repositories/project-modules.repository';

describe('TasksService', () => {
  let service: TasksService;
  let repository: {
    findById: jest.Mock;
    findByIdGlobal: jest.Mock;
    findByTenant: jest.Mock;
    findByCreator: jest.Mock;
    findByIds: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let enumRepository: {
    findByCategoryAndValue: jest.Mock;
    findValuesByIds: jest.Mock;
  };
  let sequences: { nextDisplayId: jest.Mock };
  let taskMembers: {
    create: jest.Mock;
    deleteAllForTask: jest.Mock;
    findByTaskAndUser: jest.Mock;
    findTaskIdsByUser: jest.Mock;
  };
  let modulesRepository: { findById: jest.Mock };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByIdGlobal: jest.fn(),
      findByTenant: jest.fn(),
      findByCreator: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    enumRepository = {
      findByCategoryAndValue: jest.fn(),
      findValuesByIds: jest.fn().mockResolvedValue(new Map()),
    };
    sequences = {
      nextDisplayId: jest.fn().mockResolvedValue('TSK-0001'),
    };
    taskMembers = {
      create: jest.fn(),
      deleteAllForTask: jest.fn(),
      findByTaskAndUser: jest.fn().mockResolvedValue(undefined),
      findTaskIdsByUser: jest.fn().mockResolvedValue([]),
    };
    modulesRepository = { findById: jest.fn() };

    service = new TasksService(
      repository as unknown as TasksRepository,
      enumRepository as unknown as EnumRepository,
      sequences as unknown as TenantSequencesRepository,
      taskMembers as unknown as TaskMembersRepository,
      modulesRepository as unknown as ProjectModulesRepository,
    );
  });

  describe('create', () => {
    it('resolves status (task_status) and priority (importance) to enum ids', async () => {
      enumRepository.findByCategoryAndValue.mockImplementation(
        (category: string, value: string) =>
          Promise.resolve({ id: `${category}-${value}-id` }),
      );
      repository.create.mockResolvedValue({ id: 'task-1' });

      await service.create('tenant-1', 'user-1', {
        title: 'New Task',
        status: 'To_do',
        priority: 'High',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statusId: 'task_status-To_do-id',
          priorityId: 'importance-High-id',
        }),
      );
    });

    it('derives projectId from an independent module rather than trusting the caller', async () => {
      enumRepository.findByCategoryAndValue.mockResolvedValue({
        id: 'enum-id',
      });
      modulesRepository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: null,
      });
      repository.create.mockResolvedValue({ id: 'task-1' });

      await service.create('tenant-1', 'user-1', {
        title: 'New Task',
        moduleId: 'module-1',
        projectId: 'project-should-be-ignored',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: undefined, moduleId: 'module-1' }),
      );
    });

    it('derives projectId from a project-scoped module', async () => {
      enumRepository.findByCategoryAndValue.mockResolvedValue({
        id: 'enum-id',
      });
      modulesRepository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: 'project-1',
      });
      repository.create.mockResolvedValue({ id: 'task-1' });

      await service.create('tenant-1', 'user-1', {
        title: 'New Task',
        moduleId: 'module-1',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          moduleId: 'module-1',
        }),
      );
    });
  });

  describe('delete', () => {
    it('throws NotFoundException if the task does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.delete('tenant-1', 'task-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if the caller cannot access the task', async () => {
      repository.findById.mockResolvedValue({
        id: 'task-1',
        createdBy: 'owner-1',
      });
      await expect(
        service.delete('tenant-1', 'task-1', 'outsider-1'),
      ).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('returns the deleted task when the caller is the creator', async () => {
      repository.findById.mockResolvedValue({
        id: 'task-1',
        createdBy: 'user-1',
      });
      repository.delete.mockResolvedValue({ id: 'task-1' });
      const result = await service.delete('tenant-1', 'task-1', 'user-1');
      expect(result).toEqual({ id: 'task-1' });
    });

    it('returns the deleted task when the caller is a task member', async () => {
      repository.findById.mockResolvedValue({
        id: 'task-1',
        createdBy: 'owner-1',
      });
      taskMembers.findByTaskAndUser.mockResolvedValue({ id: 'member-row' });
      repository.delete.mockResolvedValue({ id: 'task-1' });
      const result = await service.delete('tenant-1', 'task-1', 'member-1');
      expect(result).toEqual({ id: 'task-1' });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.findOne('tenant-1', 'task-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the caller is neither creator nor member', async () => {
      repository.findById.mockResolvedValue({
        id: 'task-1',
        createdBy: 'owner-1',
        statusId: null,
        priorityId: null,
        visibilityId: null,
      });
      await expect(
        service.findOne('tenant-1', 'task-1', 'outsider-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the task when the caller is the creator', async () => {
      repository.findById.mockResolvedValue({
        id: 'task-1',
        createdBy: 'user-1',
        statusId: null,
        priorityId: null,
        visibilityId: null,
      });
      const result = await service.findOne('tenant-1', 'task-1', 'user-1');
      expect(result).toEqual(expect.objectContaining({ id: 'task-1' }));
    });
  });

  describe('list', () => {
    it('filters out tasks the caller cannot see', async () => {
      repository.findByTenant.mockResolvedValue([
        {
          id: 'task-1',
          createdBy: 'user-1',
          statusId: null,
          priorityId: null,
          visibilityId: null,
        },
        {
          id: 'task-2',
          createdBy: 'owner-2',
          statusId: null,
          priorityId: null,
          visibilityId: null,
        },
      ]);
      taskMembers.findByTaskAndUser.mockResolvedValue(undefined);

      const result = await service.list('tenant-1', 'user-1');

      expect(result.map((task) => task.id)).toEqual(['task-1']);
    });
  });

  describe('listForCaller', () => {
    it('combines tasks the caller created with tasks they are a member of, across tenants', async () => {
      repository.findByCreator.mockResolvedValue([
        {
          id: 'task-own',
          createdBy: 'user-1',
          statusId: null,
          priorityId: null,
          visibilityId: null,
        },
      ]);
      taskMembers.findTaskIdsByUser.mockResolvedValue([
        'task-own',
        'task-shared',
      ]);
      repository.findByIds.mockResolvedValue([
        {
          id: 'task-shared',
          createdBy: 'owner-2',
          statusId: null,
          priorityId: null,
          visibilityId: null,
        },
      ]);

      const result = await service.listForCaller('user-1');

      expect(repository.findByIds).toHaveBeenCalledWith(['task-shared']);
      expect(result.map((task) => task.id).sort()).toEqual([
        'task-own',
        'task-shared',
      ]);
    });
  });

  describe('findOneForCaller', () => {
    it('throws NotFoundException when the caller is neither creator nor member', async () => {
      repository.findByIdGlobal.mockResolvedValue({
        id: 'task-1',
        tenantId: 'tenant-2',
        createdBy: 'owner-1',
      });
      await expect(
        service.findOneForCaller('task-1', 'outsider-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the task from its own tenant even when the caller belongs to a different tenant', async () => {
      repository.findByIdGlobal.mockResolvedValue({
        id: 'task-1',
        tenantId: 'tenant-2',
        createdBy: 'owner-1',
        statusId: null,
        priorityId: null,
        visibilityId: null,
      });
      taskMembers.findByTaskAndUser.mockResolvedValue({ id: 'member-row' });

      const result = await service.findOneForCaller('task-1', 'member-1');

      expect(taskMembers.findByTaskAndUser).toHaveBeenCalledWith(
        'tenant-2',
        'task-1',
        'member-1',
      );
      expect(result).toEqual(expect.objectContaining({ id: 'task-1' }));
    });
  });

  describe('deleteForCaller', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      repository.findByIdGlobal.mockResolvedValue(undefined);
      await expect(service.deleteForCaller('task-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("deletes using the task's own tenant, not any tenant supplied by the caller", async () => {
      repository.findByIdGlobal.mockResolvedValue({
        id: 'task-1',
        tenantId: 'tenant-2',
        createdBy: 'user-1',
      });
      repository.findById.mockResolvedValue({
        id: 'task-1',
        tenantId: 'tenant-2',
        createdBy: 'user-1',
      });
      repository.delete.mockResolvedValue({ id: 'task-1' });

      const result = await service.deleteForCaller('task-1', 'user-1');

      expect(repository.delete).toHaveBeenCalledWith('tenant-2', 'task-1');
      expect(result).toEqual({ id: 'task-1' });
    });
  });
});
