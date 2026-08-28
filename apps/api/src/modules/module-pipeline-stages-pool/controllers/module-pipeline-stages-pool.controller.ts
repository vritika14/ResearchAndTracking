// apps/api/src/modules/module-pipeline-stages-pool/controllers/module-pipeline-stages-pool.controller.ts
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
import { TenantMemberGuard } from '../../memberships/policies/tenant-member.guard';
import { CreatePipelineStageDto } from '../dto/create-pipeline-stage.dto';
import { UpdatePipelineStageDto } from '../dto/update-pipeline-stage.dto';
import { ModulePipelineStagesPoolService } from '../services/module-pipeline-stages-pool.service';

@ApiTags('module-pipeline-stages-pool')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/module-pipeline-stages')
export class ModulePipelineStagesPoolController {
  constructor(private readonly service: ModulePipelineStagesPoolService) {}

  @ApiOperation({
    summary:
      'List module pipeline stages available to this workspace (base + custom)',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get()
  async list(@Param('tenantId') tenantId: string) {
    return this.service.list(tenantId);
  }

  @ApiOperation({
    summary:
      'Create a custom module pipeline stage for this workspace (owner only)',
  })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreatePipelineStageDto,
  ) {
    return this.service.create(tenantId, dto.value, dto.sortOrder ?? 0);
  }

  @ApiOperation({
    summary: 'Rename or reorder a custom module pipeline stage (owner only)',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Patch(':id')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePipelineStageDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @ApiOperation({
    summary: 'Remove a custom module pipeline stage (owner only)',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Delete(':id')
  async remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }
}
