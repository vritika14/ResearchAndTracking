import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

interface AuthenticatedRequest extends Request {
  user: { sub: string; username?: string };
}

@Controller('api/v1/me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMe(@Req() req: AuthenticatedRequest) {
    const { sub } = req.user;

    const user = await this.usersService.findOrProvisionByExternalAuthId(sub);

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
