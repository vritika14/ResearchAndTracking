import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationEmailService } from './invitation-email.service';

describe('InvitationEmailService', () => {
  const ses = { send: jest.fn() };
  const config = { get: jest.fn(), getOrThrow: jest.fn() };
  let service: InvitationEmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('verified@example.com');
    config.getOrThrow.mockReturnValue('http://localhost:5173');
    ses.send.mockResolvedValue({ MessageId: 'message-1' });
    service = new InvitationEmailService(
      ses as never,
      config as unknown as ConfigService,
    );
  });

  it('sends the project acceptance link through SES', async () => {
    await expect(
      service.sendInvitation({
        email: 'researcher@example.com',
        targetType: 'project',
        targetTitle: 'Enzyme Kinetics',
        acceptanceToken: 'raw-secret-token',
        expiresAt: new Date('2026-08-15T00:00:00.000Z'),
      }),
    ).resolves.toBe('message-1');

    const command = ses.send.mock.calls[0]?.[0] as {
      input: {
        Destination: { ToAddresses: string[] };
        Content: { Simple: { Body: { Text: { Data: string } } } };
      };
    };
    expect(command.input.Destination.ToAddresses).toEqual([
      'researcher@example.com',
    ]);
    expect(command.input.Content.Simple.Body.Text.Data).toContain(
      'http://localhost:5173/invitations/raw-secret-token',
    );
    expect(command.input.Content.Simple.Body.Text.Data).toContain(
      'Enzyme Kinetics',
    );
  });

  it('fails clearly when the SES sender is not configured', async () => {
    config.get.mockReturnValue(undefined);

    await expect(
      service.sendInvitation({
        email: 'researcher@example.com',
        targetType: 'module',
        targetTitle: 'Literature Review',
        acceptanceToken: 'token',
        expiresAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(ses.send).not.toHaveBeenCalled();
  });
});
