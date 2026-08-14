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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../auth/jwt.strategy';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UsersService } from '../../users/users.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TasksService } from '../services/tasks.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/projects/:projectId/tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'List tasks for a project' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.listByProject(tenantId, projectId);
  }

  @ApiOperation({ summary: 'Get a single task' })
  @UseGuards(JwtAuthGuard)
  @Get(':taskId')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.findOne(tenantId, taskId);
  }

  @ApiOperation({ summary: 'Create a task' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTaskDto,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.tasksService.create(projectId, tenantId, user.id, dto);
  }

  @ApiOperation({ summary: 'Update a task' })
  @UseGuards(JwtAuthGuard)
  @Patch(':taskId')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(tenantId, taskId, dto);
  }

  @ApiOperation({ summary: 'Delete a task' })
  @UseGuards(JwtAuthGuard)
  @Delete(':taskId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.delete(tenantId, taskId);
  }
}
