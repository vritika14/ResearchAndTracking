// apps/api/src/modules/task-members/controllers/task-members.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AddMemberDto } from '../dto/add-member.dto';
import { TaskMembersService } from '../services/task-members.service';

@ApiTags('task-members')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/tasks/:taskId/members')
export class TaskMembersController {
  constructor(private readonly service: TaskMembersService) {}

  @ApiOperation({ summary: 'List members who can see this shared task' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.service.list(tenantId, taskId);
  }

  @ApiOperation({ summary: 'Grant a user access to this shared task' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard)
  @Post()
  async add(
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.add(tenantId, taskId, dto.userId);
  }

  @ApiOperation({ summary: "Remove a user's access to this shared task" })
  @UseGuards(JwtAuthGuard)
  @Delete(':userId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.remove(tenantId, taskId, userId);
  }
}
