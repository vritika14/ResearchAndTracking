import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CalendarEventsService } from './calendar-events.service';
import { CalendarEventsRepository } from '../repositories/calendar-events.repository';

describe('CalendarEventsService', () => {
  let service: CalendarEventsService;
  let repository: {
    findPageByTenant: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const tenantId = 'tenant-1';
  const callerUserId = 'user-1';

  beforeEach(() => {
    repository = {
      findPageByTenant: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    service = new CalendarEventsService(
      repository as unknown as CalendarEventsRepository,
    );
  });

  describe('list', () => {
    it('returns a paginated list of events for the tenant', async () => {
      repository.findPageByTenant.mockResolvedValue({
        data: [{ id: 'event-1' }],
        totalItems: 21,
      });

      const result = await service.list(tenantId, 2, 20);

      expect(repository.findPageByTenant).toHaveBeenCalledWith(
        tenantId,
        20,
        20,
      );
      expect(result).toEqual({
        data: [{ id: 'event-1' }],
        meta: { page: 2, pageSize: 20, totalItems: 21, totalPages: 2 },
      });
    });
  });

  describe('create', () => {
    it('trims the title and records the caller as creator', async () => {
      repository.create.mockResolvedValue({ id: 'event-1' });

      await service.create(tenantId, callerUserId, {
        title: '  Lab booking closes  ',
        eventDate: '2026-09-15',
      });

      expect(repository.create).toHaveBeenCalledWith({
        tenantId,
        createdBy: callerUserId,
        title: 'Lab booking closes',
        eventDate: '2026-09-15',
      });
    });
  });

  describe('update', () => {
    it('rejects when the caller did not create the event', async () => {
      repository.findById.mockResolvedValue({
        id: 'event-1',
        createdBy: 'someone-else',
      });

      await expect(
        service.update(tenantId, 'event-1', callerUserId, {
          title: 'New title',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('throws when the event does not exist', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(
        service.update(tenantId, 'event-1', callerUserId, { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the event when the caller is the creator', async () => {
      repository.findById.mockResolvedValue({
        id: 'event-1',
        createdBy: callerUserId,
      });
      repository.update.mockResolvedValue({ id: 'event-1', title: 'Updated' });

      const result = await service.update(tenantId, 'event-1', callerUserId, {
        title: '  Updated  ',
      });

      expect(repository.update).toHaveBeenCalledWith(tenantId, 'event-1', {
        title: 'Updated',
        eventDate: undefined,
      });
      expect(result).toEqual({ id: 'event-1', title: 'Updated' });
    });
  });

  describe('remove', () => {
    it('rejects when the caller did not create the event', async () => {
      repository.findById.mockResolvedValue({
        id: 'event-1',
        createdBy: 'someone-else',
      });

      await expect(
        service.remove(tenantId, 'event-1', callerUserId),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('deletes the event when the caller is the creator', async () => {
      repository.findById.mockResolvedValue({
        id: 'event-1',
        createdBy: callerUserId,
      });
      repository.remove.mockResolvedValue({ id: 'event-1' });

      const result = await service.remove(tenantId, 'event-1', callerUserId);

      expect(repository.remove).toHaveBeenCalledWith(tenantId, 'event-1');
      expect(result).toEqual({
        message: 'Calendar event deleted successfully',
        event: { id: 'event-1' },
      });
    });
  });
});
