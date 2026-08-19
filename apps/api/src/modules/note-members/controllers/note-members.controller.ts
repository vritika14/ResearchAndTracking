// apps/api/src/modules/note-members/controllers/note-members.controller.ts
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
import { AddMemberDto } from '../dto/add-member.dto';
import { NoteMembersService } from '../services/note-members.service';
import { TenantMemberGuard } from '../../memberships/policies/tenant-member.guard';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('note-members')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/notes/:noteId/members')
export class NoteMembersController {
  constructor(
    private readonly service: NoteMembersService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'List members who can see this shared note' })
  @UseGuards(JwtAuthGuard,TenantMemberGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.service.list(tenantId, noteId, user.id);
  }

  @ApiOperation({ summary: 'Grant a user access to this shared note' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard,TenantMemberGuard)
  @Post()
  async add(
    @Param('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.add(tenantId, noteId, dto.userId);
  }

  @ApiOperation({ summary: "Remove a user's access to this shared note" })
  @UseGuards(JwtAuthGuard,TenantMemberGuard)
  @Delete(':userId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.remove(tenantId, noteId, userId);
  }
}
