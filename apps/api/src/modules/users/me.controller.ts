import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import type { AuthenticatedPrincipal } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('account')
@ApiBearerAuth()
@Controller('api/v1/me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Return or provision the authenticated user profile',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findOrProvisionFromAccessToken(
      req.user.sub,
      req.user.accessToken,
    );

    if (!user) {
      throw new NotFoundException('User could not be found or provisioned');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
    };
  }
}
