import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthenticatedPrincipal } from '../../auth/jwt.strategy';
import { UsersService } from '../../users/users.service';
import { MembershipsService } from '../services/memberships.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('invitations')
@Controller('api/v1/invitations')
export class InvitationsController {
  constructor(
    private readonly membershipsService: MembershipsService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Preview a workspace invitation before sign-in' })
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.membershipsService.previewInvitation(token);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept the invitation for the authenticated email',
  })
  @UseGuards(JwtAuthGuard)
  @Post(':token/accept')
  async accept(
    @Param('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findOrProvisionFromAccessToken(
      req.user.sub,
      req.user.accessToken,
    );

    if (!user) {
      throw new NotFoundException('User could not be found or provisioned');
    }

    return this.membershipsService.acceptInvitation(token, user.id, user.email);
  }
}
