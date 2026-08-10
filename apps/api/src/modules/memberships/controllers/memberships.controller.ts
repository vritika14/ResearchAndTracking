/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { UsersService } from '../../users/users.service';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { MembershipResponseDto } from '../dto/membership-response.dto';
import { TenantMemberGuard } from '../policies/tenant-member.guard';
import { TenantOwnerGuard } from '../policies/tenant-owner.guard';
import { MembershipsService } from '../services/memberships.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('memberships')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId')
export class MembershipsController {
  constructor(
    private readonly membershipsService: MembershipsService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'List active members of a tenant' })
  @ApiResponse({ status: 200, type: [MembershipResponseDto] })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get('members')
  async listMembers(@Param('tenantId') tenantId: string) {
    return this.membershipsService.listMembers(tenantId);
  }

  @ApiOperation({
    summary: 'Invite a limited workspace member (owner only)',
    description:
      'Workspace invitations never create another owner. Project editor/viewer access is added later through project_members.',
  })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard, TenantOwnerGuard)
  @Post('invitations')
  async inviteMember(
    @Param('tenantId') tenantId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateInvitationDto,
  ) {
    const invitedByUser = await this.usersService.findByExternalAuthId(
      req.user.sub,
    );
    return this.membershipsService.inviteMember(
      tenantId,
      invitedByUser.id,
      dto.email,
    );
  }

  @ApiOperation({ summary: 'Revoke a non-owner workspace member' })
  @ApiResponse({ status: 200, type: MembershipResponseDto })
  @UseGuards(JwtAuthGuard, TenantOwnerGuard)
  @Delete('members/:membershipId')
  async revokeMember(
    @Param('tenantId') tenantId: string,
    @Param('membershipId') membershipId: string,
  ) {
    return this.membershipsService.revokeMember(tenantId, membershipId);
  }
}
