// apps/api/src/modules/module-pipeline-stages/controllers/module-pipeline-stages.controller.ts
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { TenantMemberGuard } from '../../memberships/policies/tenant-member.guard';
import { UsersService } from '../../users/users.service';
import { ModuleCollaboratorsRepository } from '../../module-collaborators/repositories/module-collaborators.repository';
import { EnumRepository } from '../../enum/repositories/enum.repository';
import { CreatePipelineStageDto } from '../dto/create-pipeline-stage.dto';
import { UpdatePipelineStageDto } from '../dto/update-pipeline-stage.dto';
import { ModulePipelineStagesService } from '../services/module-pipeline-stage.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('module-pipeline-stages')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/modules/:moduleId/pipeline-stages')
export class ModulePipelineStagesController {
  constructor(
    private readonly service: ModulePipelineStagesService,
    private readonly usersService: UsersService,
    private readonly moduleCollaboratorsRepository: ModuleCollaboratorsRepository,
    private readonly enumRepository: EnumRepository,
  ) {}

  private async assertOwner(
    tenantId: string,
    moduleId: string,
    req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    const membership =
      await this.moduleCollaboratorsRepository.findByModuleAndUser(
        tenantId,
        moduleId,
        user.id,
      );
    if (!membership) {
      throw new ForbiddenException(
        'Only the module owner can manage its pipeline stages',
      );
    }
    const ownerRole = await this.enumRepository.findByCategoryAndValue(
      'project_role',
      'Owner',
    );
    if (!ownerRole || membership.roleId !== ownerRole.id) {
      throw new ForbiddenException(
        'Only the module owner can manage its pipeline stages',
      );
    }
  }

  @ApiOperation({
    summary: 'List pipeline stages available to this module (base + custom)',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.service.list(moduleId);
  }

  @ApiOperation({
    summary: 'Create a custom pipeline stage for this module (owner only)',
  })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePipelineStageDto,
  ) {
    await this.assertOwner(tenantId, moduleId, req);
    return this.service.create(moduleId, dto.value, dto.sortOrder ?? 0);
  }

  @ApiOperation({
    summary: 'Rename or reorder a custom pipeline stage (owner only)',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Patch(':id')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePipelineStageDto,
  ) {
    await this.assertOwner(tenantId, moduleId, req);
    return this.service.update(moduleId, id, dto);
  }

  @ApiOperation({ summary: 'Remove a custom pipeline stage (owner only)' })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Delete(':id')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.assertOwner(tenantId, moduleId, req);
    return this.service.remove(moduleId, id);
  }
}
