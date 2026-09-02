// apps/api/src/modules/projects/controllers/my-projects.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../auth/jwt.strategy';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UsersService } from '../../users/users.service';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectsService } from '../services/projects.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

/**
 * Tenant-agnostic view of projects the caller can access — a project the
 * caller owns or was explicitly added to as a collaborator, regardless of
 * which workspace it belongs to. Guarded by JwtAuthGuard only, not
 * TenantMemberGuard, mirroring MyTasksController: project access never
 * depended on tenant membership, so a project shared with someone outside
 * the owning tenant must still be reachable.
 */
@ApiTags('projects')
@ApiBearerAuth()
@Controller('api/v1/me/projects')
export class MyProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({
    summary: 'List every project the caller can access, across all workspaces',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.projectsService.listForCaller(user.id);
  }

  @ApiOperation({ summary: 'Get a single project the caller can access' })
  @UseGuards(JwtAuthGuard)
  @Get(':projectId')
  async findOne(
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.projectsService.findOneForCaller(projectId, user.id);
  }

  @ApiOperation({
    summary: 'List the selected pipeline stages for an accessible project',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':projectId/pipeline-stages')
  async listPipelineStages(
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.projectsService.listPipelineStagesForCaller(projectId, user.id);
  }

  @ApiOperation({ summary: 'Update a project the caller can access' })
  @UseGuards(JwtAuthGuard)
  @Patch(':projectId')
  async update(
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProjectDto,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.projectsService.updateForCaller(projectId, user.id, dto);
  }

  @ApiOperation({ summary: 'Archive a project the caller can access' })
  @UseGuards(JwtAuthGuard)
  @Delete(':projectId')
  async archive(
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.projectsService.archiveForCaller(projectId, user.id);
  }
}
