import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { Request } from 'express';
  import type { AuthenticatedPrincipal } from '../../auth/jwt.strategy';
  import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
  import { UsersService } from '../../users/users.service';
  import { CreateProjectDto } from '../dto/create-project.dto';
  import { UpdateProjectDto } from '../dto/update-project.dto';
  import { ProjectsService } from '../services/projects.service';
  
  interface AuthenticatedRequest extends Request {
    user: AuthenticatedPrincipal;
  }
  
  @ApiTags('projects')
  @ApiBearerAuth()
  @Controller('api/v1/tenant/:tenantId/projects')
  export class ProjectsController {
    constructor(
      private readonly projectsService: ProjectsService,
      private readonly usersService: UsersService,
    ) {}
  
    @ApiOperation({ summary: 'List active (non-archived) projects for a workspace' })
    @UseGuards(JwtAuthGuard)
    @Get()
    async list(@Param('tenantId') tenantId: string) {
      return this.projectsService.listActive(tenantId);
    }
  
    @ApiOperation({ summary: 'Get a single project' })
    @UseGuards(JwtAuthGuard)
    @Get(':projectId')
    async findOne(@Param('tenantId') tenantId: string, @Param('projectId') projectId: string) {
      return this.projectsService.findOne(tenantId, projectId);
    }
  
    @ApiOperation({ summary: 'Create a project' })
    @ApiResponse({ status: 201 })
    @UseGuards(JwtAuthGuard)
    @Post()
    async create(
      @Param('tenantId') tenantId: string,
      @Req() req: AuthenticatedRequest,
      @Body() dto: CreateProjectDto,
    ) {
      const user = await this.usersService.findByExternalAuthId(req.user.sub);
      return this.projectsService.create(user.id, tenantId, dto);
    }
  
    @ApiOperation({ summary: 'Update a project' })
    @UseGuards(JwtAuthGuard)
    @Patch(':projectId')
    async update(
      @Param('tenantId') tenantId: string,
      @Param('projectId') projectId: string,
      @Body() dto: UpdateProjectDto,
    ) {
      return this.projectsService.update(tenantId, projectId, dto);
    }
  
    @ApiOperation({ summary: 'Archive a project (auto-deleted after 14 days)' })
    @UseGuards(JwtAuthGuard)
    @Delete(':projectId')
    async archive(@Param('tenantId') tenantId: string, @Param('projectId') projectId: string) {
      return this.projectsService.archive(tenantId, projectId);
    }
  }
  