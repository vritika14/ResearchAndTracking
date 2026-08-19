// apps/api/src/modules/notes/services/notes.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesRepository } from '../repositories/notes.repository';
import { TenantSequencesRepository } from '../../tenant-sequences/repositories/tenant-sequences.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { NoteMembersRepository } from '../../note-members/repositories/note-members.repository';
import { ProjectModulesRepository } from '../../project-modules/repositories/project-modules.repository';

describe('NotesService', () => {
  let service: NotesService;
  let repository: {
    findById: jest.Mock;
    findByTenant: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let sequences: { nextDisplayId: jest.Mock };
  let enumRepository: { findByCategoryAndValue: jest.Mock };
  let noteMembers: {
    create: jest.Mock;
    deleteAllForNote: jest.Mock;
    findByNoteAndUser: jest.Mock;
  };
  let modulesRepository: { findById: jest.Mock };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByTenant: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    sequences = {
      nextDisplayId: jest.fn().mockResolvedValue('NTE-0001'),
    };
    enumRepository = {
      findByCategoryAndValue: jest
        .fn()
        .mockResolvedValue({ id: 'visibility-private-id' }),
    };
    noteMembers = {
      create: jest.fn(),
      deleteAllForNote: jest.fn(),
      findByNoteAndUser: jest.fn().mockResolvedValue(undefined),
    };
    modulesRepository = { findById: jest.fn() };

    service = new NotesService(
      repository as unknown as NotesRepository,
      enumRepository as unknown as EnumRepository,
      sequences as unknown as TenantSequencesRepository,
      noteMembers as unknown as NoteMembersRepository,
      modulesRepository as unknown as ProjectModulesRepository,
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

    it('derives projectId from an independent module rather than trusting the caller', async () => {
      modulesRepository.findById.mockResolvedValue({
        id: 'module-1',
        projectId: null,
      });
      repository.create.mockResolvedValue({ id: 'note-1' });

      await service.create('tenant-1', 'user-1', {
        title: 'Meeting Notes',
        moduleId: 'module-1',
        projectId: 'project-should-be-ignored',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: undefined, moduleId: 'module-1' }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the note does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.findOne('tenant-1', 'note-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the caller is neither creator nor member', async () => {
      repository.findById.mockResolvedValue({
        id: 'note-1',
        createdBy: 'owner-1',
      });
      await expect(
        service.findOne('tenant-1', 'note-1', 'outsider-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the note when the caller is the creator', async () => {
      repository.findById.mockResolvedValue({
        id: 'note-1',
        createdBy: 'user-1',
      });
      const result = await service.findOne('tenant-1', 'note-1', 'user-1');
      expect(result).toEqual(expect.objectContaining({ id: 'note-1' }));
    });

    it('returns the note when the caller is a note member', async () => {
      repository.findById.mockResolvedValue({
        id: 'note-1',
        createdBy: 'owner-1',
      });
      noteMembers.findByNoteAndUser.mockResolvedValue({ id: 'member-row' });
      const result = await service.findOne('tenant-1', 'note-1', 'member-1');
      expect(result).toEqual(expect.objectContaining({ id: 'note-1' }));
    });
  });

  describe('list', () => {
    it('filters out notes the caller cannot see', async () => {
      repository.findByTenant.mockResolvedValue([
        { id: 'note-1', createdBy: 'user-1' },
        { id: 'note-2', createdBy: 'owner-2' },
      ]);

      const result = await service.list('tenant-1', 'user-1');

      expect(result.map((note) => note.id)).toEqual(['note-1']);
    });
  });

  describe('update', () => {
    it('throws NotFoundException if the note does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.update('tenant-1', 'note-1', 'user-1', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if the caller cannot access the note', async () => {
      repository.findById.mockResolvedValue({
        id: 'note-1',
        createdBy: 'owner-1',
      });
      await expect(
        service.update('tenant-1', 'note-1', 'outsider-1', {
          title: 'Updated',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('throws NotFoundException if the note does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);
      await expect(
        service.delete('tenant-1', 'note-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if the caller cannot access the note', async () => {
      repository.findById.mockResolvedValue({
        id: 'note-1',
        createdBy: 'owner-1',
      });
      await expect(
        service.delete('tenant-1', 'note-1', 'outsider-1'),
      ).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('returns the deleted note when the caller is the creator', async () => {
      repository.findById.mockResolvedValue({
        id: 'note-1',
        createdBy: 'user-1',
      });
      repository.delete.mockResolvedValue({ id: 'note-1' });
      const result = await service.delete('tenant-1', 'note-1', 'user-1');
      expect(result).toEqual({ id: 'note-1' });
    });
  });
});
