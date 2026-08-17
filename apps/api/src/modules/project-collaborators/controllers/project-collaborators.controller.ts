// apps/api/src/modules/project-collaborators/controllers/project-collaborators.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AddCollaboratorDto } from '../dto/add-collaborator.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { ProjectCollaboratorsService } from '../services/project-collaborators.service';

@ApiTags('project-collaborators')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/projects/:projectId/collaborators')
export class ProjectCollaboratorsController {
  constructor(private readonly service: ProjectCollaboratorsService) {}

  @ApiOperation({ summary: 'List collaborators on a project' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Param('tenantId') tenantId: string, @Param('projectId') projectId: string) {
    return this.service.list(tenantId, projectId);
  }

  @ApiOperation({ summary: 'Add a collaborator to a project' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard)
  @Post()
  async add(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() dto: AddCollaboratorDto,
  ) {
    return this.service.add(tenantId, projectId, dto.userId, dto.role);
  }

  @ApiOperation({ summary: "Update a collaborator's role" })
  @UseGuards(JwtAuthGuard)
  @Patch(':userId')
  async updateRole(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.service.updateRole(tenantId, projectId, userId, dto.role);
  }

  @ApiOperation({ summary: 'Remove a collaborator from a project' })
  @UseGuards(JwtAuthGuard)
  @Delete(':userId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.remove(tenantId, projectId, userId);
  }
}
