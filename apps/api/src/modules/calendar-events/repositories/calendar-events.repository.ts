import { Injectable } from '@nestjs/common';
import { calendarEvents } from '@research-tracker/migrations';
import { and, asc, eq, sql } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

interface CreateCalendarEventValues {
  tenantId: string;
  createdBy: string;
  title: string;
  eventDate: string;
}

interface UpdateCalendarEventValues {
  title?: string;
  eventDate?: string;
}

@Injectable()
export class CalendarEventsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  /**
   * Lists every calendar event in the tenant, one page at a time.
   *
   * Calendar events have no per-record visibility rules — every tenant
   * member can see every event, the same way "General" tasks and notes work.
   */
  async findPageByTenant(tenantId: string, offset: number, limit: number) {
    const [data, countResult] = await Promise.all([
      this.drizzle.db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.tenantId, tenantId))
        .orderBy(asc(calendarEvents.eventDate), asc(calendarEvents.id))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ count: sql<number>`count(*)::int` })
        .from(calendarEvents)
        .where(eq(calendarEvents.tenantId, tenantId)),
    ]);

    return {
      data,
      totalItems: countResult[0]?.count ?? 0,
    };
  }

  async findById(tenantId: string, eventId: string) {
    const [event] = await this.drizzle.db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.tenantId, tenantId),
          eq(calendarEvents.id, eventId),
        ),
      );

    return event;
  }

  async create(values: CreateCalendarEventValues) {
    const [event] = await this.drizzle.db
      .insert(calendarEvents)
      .values(values)
      .returning();

    return event;
  }

  async update(
    tenantId: string,
    eventId: string,
    values: UpdateCalendarEventValues,
  ) {
    const [event] = await this.drizzle.db
      .update(calendarEvents)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(calendarEvents.tenantId, tenantId),
          eq(calendarEvents.id, eventId),
        ),
      )
      .returning();

    return event;
  }

  async remove(tenantId: string, eventId: string) {
    const [event] = await this.drizzle.db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.tenantId, tenantId),
          eq(calendarEvents.id, eventId),
        ),
      )
      .returning();

    return event;
  }
}
