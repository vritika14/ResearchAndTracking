// apps/api/src/modules/project-pipeline-stages/controllers/project-pipeline-stages.controller.ts
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
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
import { TenantMemberGuard } from '../../memberships/policies/tenant-member.guard';
import { UsersService } from '../../users/users.service';
import { ProjectsRepository } from '../../projects/repositories/projects.repository';
import { CreatePipelineStageDto } from '../dto/create-pipeline-stage.dto';
import { UpdatePipelineStageDto } from '../dto/update-pipeline-stage.dto';
import { ProjectPipelineStagesService } from '../services/project-pipeline-stages.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('project-pipeline-stages')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/projects/:projectId/pipeline-stages')
export class ProjectPipelineStagesController {
  constructor(
    private readonly service: ProjectPipelineStagesService,
    private readonly usersService: UsersService,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  private async assertOwner(
    tenantId: string,
    projectId: string,
    req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    const project = await this.projectsRepository.findById(tenantId, projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.userId !== user.id) {
      throw new ForbiddenException(
        'Only the project owner can manage its pipeline stages',
      );
    }
  }

  @ApiOperation({
    summary: 'List pipeline stages available to this project (base + custom)',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
  ) {
    const project = await this.projectsRepository.findById(tenantId, projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.service.list(projectId);
  }

  @ApiOperation({
    summary: 'Create a custom pipeline stage for this project (owner only)',
  })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePipelineStageDto,
  ) {
    await this.assertOwner(tenantId, projectId, req);
    return this.service.create(projectId, dto.value, dto.sortOrder ?? 0);
  }

  @ApiOperation({
    summary: 'Rename or reorder a custom pipeline stage (owner only)',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Patch(':id')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePipelineStageDto,
  ) {
    await this.assertOwner(tenantId, projectId, req);
    return this.service.update(projectId, id, dto);
  }

  @ApiOperation({ summary: 'Remove a custom pipeline stage (owner only)' })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Delete(':id')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.assertOwner(tenantId, projectId, req);
    return this.service.remove(projectId, id);
  }
}
