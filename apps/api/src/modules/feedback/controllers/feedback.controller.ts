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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthenticatedPrincipal } from '../../auth/jwt.strategy';
import { TenantMemberGuard } from '../../memberships/policies/tenant-member.guard';
import { UsersService } from '../../users/users.service';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { UpdateFeedbackDto } from '../dto/update-feedback.dto';
import { FeedbackService } from '../services/feedback.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}

@ApiTags('feedback')
@ApiBearerAuth()
@Controller('api/v1/tenant/:tenantId/feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({
    summary: 'List feedback submitted by the authenticated user',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get()
  async list(
    @Param('tenantId') tenantId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    return this.feedbackService.list(tenantId, user.id);
  }

  @ApiOperation({
    summary: 'Get feedback submitted by the authenticated user',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Get(':feedbackId')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('feedbackId') feedbackId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    return this.feedbackService.findOne(tenantId, feedbackId, user.id);
  }

  @ApiOperation({
    summary: 'Submit feedback',
  })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFeedbackDto,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    return this.feedbackService.create(tenantId, user.id, dto);
  }

  @ApiOperation({
    summary: 'Update feedback submitted by the authenticated user',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Patch(':feedbackId')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('feedbackId') feedbackId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateFeedbackDto,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    return this.feedbackService.update(tenantId, feedbackId, user.id, dto);
  }

  @ApiOperation({
    summary: 'Delete feedback submitted by the authenticated user',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @UseGuards(JwtAuthGuard, TenantMemberGuard)
  @Delete(':feedbackId')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('feedbackId') feedbackId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    return this.feedbackService.remove(tenantId, feedbackId, user.id);
  }
}
