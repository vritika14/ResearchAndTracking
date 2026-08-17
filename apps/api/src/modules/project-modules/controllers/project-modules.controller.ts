// apps/api/src/modules/project-modules/controllers/project-modules.controller.ts
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
import { CreateModuleDto } from '../dto/create-module.dto';
import { UpdateModuleDto } from '../dto/update-module.dto';
import { ProjectModulesService } from '../services/project-modules.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('modules')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/projects/:projectId/modules')
export class ProjectModulesController {
  constructor(
    private readonly modulesService: ProjectModulesService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'List active modules for a project' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.modulesService.listActive(tenantId, projectId, user.id);
  }

  @ApiOperation({ summary: 'Get a single module' })
  @UseGuards(JwtAuthGuard)
  @Get(':moduleId')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.modulesService.findOne(tenantId, moduleId, user.id);
  }

  @ApiOperation({ summary: 'Create a module' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateModuleDto,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.modulesService.create(projectId, tenantId, user.id, dto);
  }

  @ApiOperation({ summary: 'Update a module' })
  @UseGuards(JwtAuthGuard)
  @Patch(':moduleId')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateModuleDto,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.modulesService.update(tenantId, moduleId, user.id, dto);
  }

  @ApiOperation({ summary: 'Archive a module (auto-deleted after 14 days)' })
  @UseGuards(JwtAuthGuard)
  @Delete(':moduleId')
  async archive(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.modulesService.archive(tenantId, moduleId, user.id);
  }
}
