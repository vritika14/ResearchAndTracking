// apps/api/src/modules/tasks/services/tasks.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksRepository } from '../repositories/tasks.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';

describe('TasksService', () => {
  let service: TasksService;
  let repository: {
    findById: jest.Mock;
    findByProject: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let enumRepository: {
    findByCategoryAndValue: jest.Mock;
    findValuesByIds: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByProject: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    enumRepository = {
      findByCategoryAndValue: jest.fn(),
      findValuesByIds: jest.fn().mockResolvedValue(new Map()),
    };

    service = new TasksService(
      repository as unknown as TasksRepository,
      enumRepository as unknown as EnumRepository,
    );
  });

  describe('create', () => {
    it('resolves status (task_status) and priority (importance) to enum ids', async () => {
      enumRepository.findByCategoryAndValue.mockImplementation(
        (category: string, value: string) =>
          Promise.resolve({ id: `${category}-${value}-id` }),
      );
      repository.create.mockResolvedValue({ id: 'task-1' });

      await service.create('project-1', 'tenant-1', 'user-1', {
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
  });

  describe('delete', () => {
    it('throws NotFoundException if the task does not exist', async () => {
      repository.delete.mockResolvedValue(undefined);
      await expect(service.delete('tenant-1', 'task-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the deleted task on success', async () => {
      repository.delete.mockResolvedValue({ id: 'task-1' });
      const result = await service.delete('tenant-1', 'task-1');
      expect(result).toEqual({ id: 'task-1' });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(service.findOne('tenant-1', 'task-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
