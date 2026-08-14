import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateModuleDto } from '../dto/create-module.dto';
import { UpdateModuleDto } from '../dto/update-module.dto';
import { ProjectModulesService } from '../services/project-modules.service';

@ApiTags('modules')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/projects/:projectId/modules')
export class ProjectModulesController {
  constructor(private readonly modulesService: ProjectModulesService) {}

  @ApiOperation({ summary: 'List active modules for a project' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.modulesService.listActive(tenantId, projectId);
  }

  @ApiOperation({ summary: 'Get a single module' })
  @UseGuards(JwtAuthGuard)
  @Get(':moduleId')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.modulesService.findOne(tenantId, moduleId);
  }

  @ApiOperation({ summary: 'Create a module' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.modulesService.create(projectId, tenantId, dto);
  }

  @ApiOperation({ summary: 'Update a module' })
  @UseGuards(JwtAuthGuard)
  @Patch(':moduleId')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.modulesService.update(tenantId, moduleId, dto);
  }

  @ApiOperation({ summary: 'Archive a module (auto-deleted after 14 days)' })
  @UseGuards(JwtAuthGuard)
  @Delete(':moduleId')
  async archive(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.modulesService.archive(tenantId, moduleId);
  }
}
