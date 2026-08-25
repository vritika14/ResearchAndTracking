import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { MembershipResponseDto } from '../dto/membership-response.dto';
import { TenantMemberGuard } from '../policies/tenant-member.guard';
import { MembershipsService } from '../services/memberships.service';

@ApiTags('memberships')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @ApiOperation({ summary: 'List active members of a tenant' })
  @ApiResponse({ status: 200, type: [MembershipResponseDto] })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get('members')
  async listMembers(@Param('tenantId') tenantId: string) {
    return this.membershipsService.listMembers(tenantId);
  }
}
