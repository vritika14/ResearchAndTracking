import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { WorkspacesService } from '../services/workspaces.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('api/v1/workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({
    summary: 'Create a new workspace owned by the authenticated user',
  })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWorkspaceDto,
  ) {
    const user = await this.usersService.findOrProvisionFromAccessToken(
      req.user.sub,
      req.user.accessToken,
    );

    if (!user) {
      throw new NotFoundException('User could not be found or provisioned');
    }

    return this.workspacesService.createWorkspace(user.id, dto.name);
  }

  @ApiOperation({ summary: "Get the authenticated user's current workspace" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Get('current')
  async getCurrent(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findOrProvisionFromAccessToken(
      req.user.sub,
      req.user.accessToken,
    );

    if (!user) {
      throw new NotFoundException('User could not be found or provisioned');
    }

    return this.workspacesService.getCurrentWorkspace(user.id);
  }
}
