// apps/api/src/modules/project-invitations/controllers/invitation-acceptance.controller.ts
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
import type { AuthenticatedPrincipal } from '../../auth/jwt.strategy';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UsersService } from '../../users/users.service';
import { ProjectInvitationsService } from '../services/project-invitations.service';
import { ModuleInvitationsService } from '../../module-invitations/services/module-invitations.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('invitations')
@Controller('api/v1/invitations')
export class InvitationAcceptanceController {
  constructor(
    private readonly projectInvitations: ProjectInvitationsService,
    private readonly moduleInvitations: ModuleInvitationsService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({
    summary: 'Preview an invitation without needing to be logged in',
  })
  @Get(':token')
  async preview(@Param('token') token: string) {
    const project = await this.projectInvitations
      .preview(token)
      .catch(() => null);

    if (project) return { type: 'project', ...project };

    const module = await this.moduleInvitations
      .preview(token)
      .catch(() => null);
    if (module) return { type: 'module', ...module };

    throw new NotFoundException('Invitation not found');
  }

  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':token/accept')
  async accept(
    @Param('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    const project = await this.projectInvitations
      .accept(token, user.id, user.email)
      .then((row) => ({ type: 'project', row }))
      .catch(() => null);
    if (project) return project;

    const module = await this.moduleInvitations
      .accept(token, user.id, user.email)
      .then((row) => ({ type: 'module', row }))
      .catch(() => null);
    if (module) return module;

    throw new NotFoundException('Invitation not found');
  }
}
