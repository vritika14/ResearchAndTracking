import {
  Body,
  NotFoundException,
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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UsersService } from '../../users/users.service';
import { TenantMemberGuard } from '../policies/tenant-member.guard';
import { TenantOwnerGuard } from '../policies/tenant-owner.guard';
import { MembershipsService } from '../services/memberships.service';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { MembershipResponseDto } from '../dto/membership-response.dto';

interface AuthenticatedRequest extends Request {
  user: { sub: string; username?: string };
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

  @ApiOperation({ summary: 'Invite a new member to the tenant (owner only)' })
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
      dto.role,
    );
  }

  @ApiOperation({ summary: 'Accept a pending invitation' })
  @ApiResponse({ status: 200, type: MembershipResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post('invitations/:token/accept')
  async acceptInvitation(
    @Param('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const acceptingUser =
      await this.usersService.findOrProvisionByExternalAuthId(req.user.sub);

    if (!acceptingUser) {
      throw new NotFoundException('User could not be found or provisioned');
    }

    return this.membershipsService.acceptInvitation(token, acceptingUser.id);
  }

  @ApiOperation({ summary: 'Revoke a member (owner only)' })
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
