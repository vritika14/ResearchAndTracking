import { SESv2Client } from '@aws-sdk/client-sesv2';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InvitationEmailService,
  SES_CLIENT,
} from './invitation-email.service';

@Module({
  providers: [
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
  ],
  exports: [InvitationEmailService],
})
export class InvitationEmailModule {}
