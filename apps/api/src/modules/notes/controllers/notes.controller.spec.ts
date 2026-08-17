// apps/api/src/modules/notes/controllers/notes.controller.spec.ts
import { NotesController } from './notes.controller';
import { NotesService } from '../services/notes.service';
import { UsersService } from '../../users/users.service';

describe('NotesController', () => {
  let controller: NotesController;
  let notesService: {
    list: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let usersService: { findByExternalAuthId: jest.Mock };

  beforeEach(() => {
    notesService = {
      list: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    usersService = { findByExternalAuthId: jest.fn() };

    controller = new NotesController(
      notesService as unknown as NotesService,
      usersService as unknown as UsersService,
    );
  });

  describe('list', () => {
    it('delegates to the service with tenantId', async () => {
      const notes = [{ id: 'n1' }];
      notesService.list.mockResolvedValue(notes);

      const result = await controller.list('tenant-1', 'project-1');

      expect(notesService.list).toHaveBeenCalledWith('tenant-1', 'project-1');
      expect(result).toBe(notes);
    });
  });

  describe('findOne', () => {
    it('delegates to the service with tenantId and noteId', async () => {
      notesService.findOne.mockResolvedValue({ id: 'n1' });

      const result = await controller.findOne('tenant-1', 'n1');

      expect(notesService.findOne).toHaveBeenCalledWith('tenant-1', 'n1');
      expect(result).toEqual({ id: 'n1' });
    });
  });

  describe('create', () => {
    it('resolves the caller and delegates to the service', async () => {
      usersService.findByExternalAuthId.mockResolvedValue({ id: 'user-1' });
      notesService.create.mockResolvedValue({ id: 'n1' });

      const req = {
        user: { sub: 'cognito-sub-1', accessToken: 'token-1' },
      } as any;
      const dto = { title: 'New Note' };

      const result = await controller.create('tenant-1', req, dto);

      expect(usersService.findByExternalAuthId).toHaveBeenCalledWith(
        'cognito-sub-1',
      );
      expect(notesService.create).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        dto,
      );
      expect(result).toEqual({ id: 'n1' });
    });
  });

  describe('update', () => {
    it('delegates to the service with tenantId, noteId, and dto', async () => {
      notesService.update.mockResolvedValue({ id: 'n1', title: 'Updated' });
      const dto = { title: 'Updated' };

      const result = await controller.update('tenant-1', 'n1', dto);

      expect(notesService.update).toHaveBeenCalledWith('tenant-1', 'n1', dto);
      expect(result).toEqual({ id: 'n1', title: 'Updated' });
    });
  });

  describe('remove', () => {
    it('delegates to the service with tenantId and noteId', async () => {
      notesService.delete.mockResolvedValue({ id: 'n1' });

      const result = await controller.remove('tenant-1', 'n1');

      expect(notesService.delete).toHaveBeenCalledWith('tenant-1', 'n1');
      expect(result).toEqual({ id: 'n1' });
    });
  });
});
