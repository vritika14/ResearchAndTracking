// apps/api/src/modules/notes/services/notes.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesRepository } from '../repositories/notes.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { NoteMembersRepository } from '../../note-members/repositories/note-members.repository';

describe('NotesService', () => {
  let service: NotesService;
  let repository: {
    findById: jest.Mock;
    findByProject: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let sequences: { nextDisplayId: jest.Mock };
  let enumRepository: { findByCategoryAndValue: jest.Mock };
  let noteMembers: { create: jest.Mock; deleteAllForNote: jest.Mock };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByProject: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    sequences = {
      nextDisplayId: jest.fn().mockResolvedValue('NTE-0001'),
    };
    enumRepository = {
      findByCategoryAndValue: jest.fn().mockResolvedValue({ id: 'visibility-private-id' }),
    };
    noteMembers = {
      create: jest.fn(),
      deleteAllForNote: jest.fn(),
    };

    service = new NotesService(
      repository as unknown as NotesRepository,
      enumRepository as unknown as EnumRepository,
      sequences as unknown as TenantSequencesRepository,
      noteMembers as unknown as NoteMembersRepository,
    );
  });

  describe('create', () => {
    it('delegates directly to the repository, no enum resolution', async () => {
      repository.create.mockResolvedValue({ id: 'note-1' });

      const result = await service.create('tenant-1', 'user-1', {
        title: 'Meeting Notes',
        content: 'Discussed timeline',
      });

      expect(repository.create).toHaveBeenCalledWith({
        projectId: undefined,
        tenantId: 'tenant-1',
        createdBy: 'user-1',
        title: 'Meeting Notes',
        content: 'Discussed timeline',
        moduleId: undefined,
        displayId: 'NTE-0001',
        visibilityId: 'visibility-private-id',
      });
      expect(result).toEqual({ id: 'note-1' });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the note does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(service.findOne('tenant-1', 'note-1')).rejects.toThrow(
        NotFoundException,
      );
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
      await expect(service.delete('tenant-1', 'note-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
