import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { NotesService } from '../services/notes.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('notes')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/projects/:projectId/notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'List notes for a project' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.notesService.listByProject(tenantId, projectId);
  }

  @ApiOperation({ summary: 'Get a single note' })
  @UseGuards(JwtAuthGuard)
  @Get(':noteId')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.notesService.findOne(tenantId, noteId);
  }

  @ApiOperation({ summary: 'Create a note' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNoteDto,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);
    return this.notesService.create(projectId, tenantId, user.id, dto);
  }

  @ApiOperation({ summary: 'Update a note' })
  @UseGuards(JwtAuthGuard)
  @Patch(':noteId')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(tenantId, noteId, dto);
  }

  @ApiOperation({ summary: 'Delete a note' })
  @UseGuards(JwtAuthGuard)
  @Delete(':noteId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.notesService.delete(tenantId, noteId);
  }
}
