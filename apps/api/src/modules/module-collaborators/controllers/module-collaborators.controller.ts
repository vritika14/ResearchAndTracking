// apps/api/src/modules/module-collaborators/controllers/module-collaborators.controller.ts
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
import { AddCollaboratorDto } from '../dto/add-collaborator.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { ModuleCollaboratorsService } from '../services/module-collaborators.service';

@ApiTags('module-collaborators')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/modules/:moduleId/collaborators')
export class ModuleCollaboratorsController {
  constructor(private readonly service: ModuleCollaboratorsService) {}

  @ApiOperation({ summary: 'List collaborators on a module' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.service.list(tenantId, moduleId);
  }

  @ApiOperation({ summary: 'Add a collaborator to a module' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard)
  @Post()
  async add(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: AddCollaboratorDto,
  ) {
    return this.service.add(tenantId, moduleId, dto.userId, dto.role);
  }

  @ApiOperation({ summary: "Update a collaborator's role" })
  @UseGuards(JwtAuthGuard)
  @Patch(':userId')
  async updateRole(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.service.updateRole(tenantId, moduleId, userId, dto.role);
  }

  @ApiOperation({ summary: 'Remove a collaborator from a module' })
  @UseGuards(JwtAuthGuard)
  @Delete(':userId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.remove(tenantId, moduleId, userId);
  }
}
