import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthenticatedPrincipal } from '../../auth/jwt.strategy';
import { TenantMemberGuard } from '../../memberships/policies/tenant-member.guard';
import { UsersService } from '../../users/users.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { CalendarEventsService } from '../services/calendar-events.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('calendar-events')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/calendar-events')
export class CalendarEventsController {
  constructor(
    private readonly calendarEventsService: CalendarEventsService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'List calendar events for the workspace' })
  @ApiResponse({
    status: 200,
    description: 'Calendar events returned successfully',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const pageSize = this.configService.get<number>('PAGE_SIZE', 20);

    return this.calendarEventsService.list(tenantId, query.page ?? 1, pageSize);
  }

  @ApiOperation({ summary: 'Create a calendar event' })
  @ApiResponse({
    status: 201,
    description: 'Calendar event created successfully',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCalendarEventDto,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    return this.calendarEventsService.create(tenantId, user.id, dto);
  }

  @ApiOperation({ summary: 'Update a calendar event' })
  @ApiResponse({
    status: 200,
    description: 'Calendar event updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the event creator may update the event',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Patch(':eventId')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    return this.calendarEventsService.update(tenantId, eventId, user.id, dto);
  }

  @ApiOperation({ summary: 'Delete a calendar event' })
  @ApiResponse({
    status: 200,
    description: 'Calendar event deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the event creator may delete the event',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Delete(':eventId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    return this.calendarEventsService.remove(tenantId, eventId, user.id);
  }
}
