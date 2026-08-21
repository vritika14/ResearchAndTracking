// apps/api/src/modules/task-members/controllers/task-members.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { AddMemberDto } from '../dto/add-member.dto';
import { TaskMembersService } from '../services/task-members.service';
import { TenantMemberGuard } from '../../memberships/policies/tenant-member.guard';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('task-members')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/tasks/:taskId/members')
export class TaskMembersController {
  constructor(
    private readonly service: TaskMembersService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'List members who can see this shared task' })
  @UseGuards(JwtAuthGuard,TenantMemberGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.service.list(tenantId, taskId, user.id);
  }

  @ApiOperation({ summary: 'Grant a user access to this shared task' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard,TenantMemberGuard)
  @Post()
  async add(
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.add(tenantId, taskId, dto.userId);
  }

  @ApiOperation({ summary: "Remove a user's access to this shared task" })
  @UseGuards(JwtAuthGuard,TenantMemberGuard)
  @Delete(':userId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.remove(tenantId, taskId, userId);
  }
}
