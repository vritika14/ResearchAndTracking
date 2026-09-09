// apps/api/src/modules/module-pipeline-stages-pool/controllers/module-pipeline-stages-pool.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantMemberGuard } from '../../memberships/policies/tenant-member.guard';
import { UpdateStageVisibilityDto } from '../dto/update-pipeline-stage.dto';
import { ReorderStagesDto } from '../dto/reorder-stages.dto';
import { ModulePipelineStagesPoolService } from '../services/module-pipeline-stages-pool.service';

@ApiTags('module-pipeline-stages-pool')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/module-pipeline-stages')
export class ModulePipelineStagesPoolController {
  constructor(private readonly service: ModulePipelineStagesPoolService) {}

  @ApiOperation({
    summary:
      "List the workspace's paper pipeline stages, in order, with hidden state",
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get()
  async list(@Param('tenantId') tenantId: string) {
    return this.service.list(tenantId);
  }

  @ApiOperation({
    summary: 'Show or hide one of the fixed paper pipeline stages',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Patch('visibility')
  async updateVisibility(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateStageVisibilityDto,
  ) {
    return this.service.updateVisibility(tenantId, dto.value, dto.hidden);
  }

  @ApiOperation({
    summary: "Reorder the workspace's paper pipeline stages",
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Put('order')
  async reorder(
    @Param('tenantId') tenantId: string,
    @Body() dto: ReorderStagesDto,
  ) {
    return this.service.reorder(tenantId, dto.order);
  }

  @ApiOperation({
    summary:
      'Reset the workspace back to the default stage order and visibility',
  })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Post('reset')
  async reset(@Param('tenantId') tenantId: string) {
    return this.service.reset(tenantId);
  }
}
