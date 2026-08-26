// apps/api/src/modules/pipeline-stages/controllers/pipeline-stages.controller.ts
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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantMemberGuard } from '../../memberships/policies/tenant-member.guard';
import { CreatePipelineStageDto } from '../dto/create-pipeline-stage.dto';
import { UpdatePipelineStageDto } from '../dto/update-pipeline-stage.dto';
import { PipelineStagesService } from '../services/pipeline-stages.service';

@ApiTags('pipeline-stages')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/pipeline-stages')
export class PipelineStagesController {
  constructor(private readonly service: PipelineStagesService) {}

  @ApiOperation({
    summary: 'List pipeline stages available to this workspace (base + custom)',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get()
  async list(@Param('tenantId') tenantId: string) {
    return this.service.list(tenantId);
  }

  @ApiOperation({
    summary: 'Create a custom pipeline stage for this workspace (owner only)',
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
    summary: 'Rename or reorder a custom pipeline stage (owner only)',
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

  @ApiOperation({ summary: 'Remove a custom pipeline stage (owner only)' })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Delete(':id')
  async remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }
}
