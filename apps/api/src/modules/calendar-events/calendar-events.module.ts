import { Module } from '@nestjs/common';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';
import { CalendarEventsController } from './controllers/calendar-events.controller';
import { CalendarEventsRepository } from './repositories/calendar-events.repository';
import { CalendarEventsService } from './services/calendar-events.service';

@Module({
  imports: [UsersModule, MembershipsModule],
  controllers: [CalendarEventsController],
  providers: [CalendarEventsService, CalendarEventsRepository],
  exports: [CalendarEventsService, CalendarEventsRepository],
})
export class CalendarEventsModule {}
