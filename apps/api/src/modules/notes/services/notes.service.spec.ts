// apps/api/src/modules/notes/services/notes.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesRepository } from '../repositories/notes.repository';

describe('NotesService', () => {
  let service: NotesService;
  let repository: {
    findById: jest.Mock;
    findByProject: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByProject: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new NotesService(repository as unknown as NotesRepository);
  });

  describe('create', () => {
    it('delegates directly to the repository, no enum resolution', async () => {
      repository.create.mockResolvedValue({ id: 'note-1' });

      const result = await service.create('project-1', 'tenant-1', 'user-1', {
        title: 'Meeting Notes',
        content: 'Discussed timeline',
      });

      expect(repository.create).toHaveBeenCalledWith({
        projectId: 'project-1',
        tenantId: 'tenant-1',
        createdBy: 'user-1',
        title: 'Meeting Notes',
        content: 'Discussed timeline',
        moduleId: undefined,
      });
      expect(result).toEqual({ id: 'note-1' });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the note does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(service.findOne('tenant-1', 'note-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException if the note does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.update('tenant-1', 'note-1', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('throws NotFoundException if the note does not exist', async () => {
      repository.delete.mockResolvedValue(undefined);
      await expect(service.delete('tenant-1', 'note-1')).rejects.toThrow(NotFoundException);
    });
  });
});
