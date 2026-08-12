import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';

export const SES_CLIENT = Symbol('SES_CLIENT');

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

@Injectable()
export class InvitationEmailService {
  private readonly logger = new Logger(InvitationEmailService.name);

  constructor(
    @Inject(SES_CLIENT) private readonly ses: SESv2Client,
    private readonly configService: ConfigService,
  ) {}

  async sendInvitation(input: {
    email: string;
    workspaceName: string;
    acceptanceToken: string;
    expiresAt: Date;
  }) {
    const fromAddress = this.configService.get<string>('INVITATION_EMAIL_FROM');
    if (!fromAddress) {
      throw new ServiceUnavailableException(
        'Invitation email delivery is not configured',
      );
    }

    const appUrl = this.configService.getOrThrow<string>('APP_URL');
    const acceptanceUrl = `${appUrl}/invitations/${encodeURIComponent(input.acceptanceToken)}`;
    const subject = `Invitation to join ${input.workspaceName}`;
    const expiry = input.expiresAt.toLocaleString('en-AU', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Australia/Sydney',
    });
    const text = [
      'Hello,',
      '',
      `You have been invited to join the ${input.workspaceName} workspace as a limited member.`,
      '',
      'Accept your invitation using this link:',
      acceptanceUrl,
      '',
      `Sign in with ${input.email}. This invitation expires ${expiry}.`,
    ].join('\n');
    const html = `
      <h1>Workspace invitation</h1>
      <p>You have been invited to join <strong>${escapeHtml(input.workspaceName)}</strong> as a limited member.</p>
      <p><a href="${escapeHtml(acceptanceUrl)}">Accept invitation</a></p>
      <p>Sign in with <strong>${escapeHtml(input.email)}</strong>. This invitation expires ${escapeHtml(expiry)}.</p>
    `;

    try {
      const result = await this.ses.send(
        new SendEmailCommand({
          FromEmailAddress: fromAddress,
          Destination: { ToAddresses: [input.email] },
          Content: {
            Simple: {
              Subject: { Data: subject, Charset: 'UTF-8' },
              Body: {
                Text: { Data: text, Charset: 'UTF-8' },
                Html: { Data: html, Charset: 'UTF-8' },
              },
            },
          },
        }),
      );
      return result.MessageId;
    } catch (error) {
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown SES error';

      // Do not log the acceptance URL or token. AWS's error name and message
      // are enough to diagnose credentials, permissions, and SES rejections.
      this.logger.error(
        `SES invitation delivery failed (${errorName}): ${errorMessage}`,
      );
      throw new ServiceUnavailableException(
        'The invitation email could not be sent. Try again later.',
      );
    }
  }
}
