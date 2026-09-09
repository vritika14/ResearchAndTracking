import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { CalendarEventsRepository } from '../repositories/calendar-events.repository';
import {
  buildPaginationMeta,
  paginationOffset,
} from '../../../common/pagination';

@Injectable()
export class CalendarEventsService {
  constructor(private readonly repository: CalendarEventsRepository) {}

  /**
   * Lists every calendar event in the tenant — visible to any tenant member.
   */
  async list(tenantId: string, page: number, pageSize: number) {
    const offset = paginationOffset(page, pageSize);

    const { data, totalItems } = await this.repository.findPageByTenant(
      tenantId,
      offset,
      pageSize,
    );

    return {
      data,
      meta: buildPaginationMeta(page, pageSize, totalItems),
    };
  }

  async create(
    tenantId: string,
    callerUserId: string,
    input: CreateCalendarEventDto,
  ) {
    const event = await this.repository.create({
      tenantId,
      createdBy: callerUserId,
      title: input.title.trim(),
      eventDate: input.eventDate,
    });

    if (!event) {
      throw new NotFoundException('Failed to create calendar event');
    }

    return event;
  }

  /**
   * Updates a calendar event.
   *
   * Only the user who created the event may update it.
   */
  async update(
    tenantId: string,
    eventId: string,
    callerUserId: string,
    input: UpdateCalendarEventDto,
  ) {
    const existing = await this.repository.findById(tenantId, eventId);

    if (!existing) {
      throw new NotFoundException('Calendar event not found');
    }

    if (existing.createdBy !== callerUserId) {
      throw new ForbiddenException(
        'Only the event creator can update this calendar event',
      );
    }

    const event = await this.repository.update(tenantId, eventId, {
      title: input.title?.trim(),
      eventDate: input.eventDate,
    });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    return event;
  }

  /**
   * Deletes a calendar event.
   *
   * Only the user who created the event may delete it.
   */
  async remove(tenantId: string, eventId: string, callerUserId: string) {
    const existing = await this.repository.findById(tenantId, eventId);

    if (!existing) {
      throw new NotFoundException('Calendar event not found');
    }

    if (existing.createdBy !== callerUserId) {
      throw new ForbiddenException(
        'Only the event creator can delete this calendar event',
      );
    }

    const event = await this.repository.remove(tenantId, eventId);

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    return {
      message: 'Calendar event deleted successfully',
      event,
    };
  }
}
