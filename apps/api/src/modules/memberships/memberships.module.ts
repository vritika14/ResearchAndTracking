import { SESv2Client } from '@aws-sdk/client-sesv2';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { InvitationsController } from './controllers/invitations.controller';
import { MembershipsController } from './controllers/memberships.controller';
import { TenantMemberGuard } from './policies/tenant-member.guard';
import { TenantOwnerGuard } from './policies/tenant-owner.guard';
import { MembershipsRepository } from './repositories/memberships.repository';
import {
  InvitationEmailService,
  SES_CLIENT,
} from './services/invitation-email.service';
import { MembershipsService } from './services/memberships.service';

@Module({
  imports: [UsersModule],
  controllers: [MembershipsController, InvitationsController],
  providers: [
    MembershipsService,
    InvitationEmailService,
    {
      provide: SES_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new SESv2Client({
          region:
            configService.get<string>('INVITATION_EMAIL_REGION') ??
            configService.getOrThrow<string>('COGNITO_REGION'),
        }),
    },
    MembershipsRepository,
    TenantOwnerGuard,
    TenantMemberGuard,
  ],
  exports: [MembershipsService, MembershipsRepository],
})
export class MembershipsModule {}
