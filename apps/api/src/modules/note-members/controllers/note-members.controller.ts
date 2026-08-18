// apps/api/src/modules/note-members/controllers/note-members.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AddMemberDto } from '../dto/add-member.dto';
import { NoteMembersService } from '../services/note-members.service';

@ApiTags('note-members')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/notes/:noteId/members')
export class NoteMembersController {
  constructor(private readonly service: NoteMembersService) {}

  @ApiOperation({ summary: 'List members who can see this shared note' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.service.list(tenantId, noteId);
  }

  @ApiOperation({ summary: 'Grant a user access to this shared note' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard)
  @Post()
  async add(
    @Param('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.add(tenantId, noteId, dto.userId);
  }

  @ApiOperation({ summary: "Remove a user's access to this shared note" })
  @UseGuards(JwtAuthGuard)
  @Delete(':userId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.remove(tenantId, noteId, userId);
  }
}
