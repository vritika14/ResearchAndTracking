import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as jwksRsa from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface CognitoAccessTokenPayload {
  sub: string;
  token_use: string;
  client_id?: string;
  scope?: string;
  username?: string;
  [key: string]: unknown;
}

export interface AuthenticatedPrincipal {
  sub: string;
  username?: string;
  accessToken: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly expectedClientId: string;

  constructor(configService: ConfigService) {
    const region = configService.getOrThrow<string>('COGNITO_REGION');
    const userPoolId = configService.getOrThrow<string>('COGNITO_USER_POOL_ID');
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    const expectedClientId =
      configService.getOrThrow<string>('COGNITO_CLIENT_ID');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer,
      algorithms: ['RS256'],
      passReqToCallback: true,
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}/.well-known/jwks.json`,
      }),
    });

    this.expectedClientId = expectedClientId;
  }

  validate(
    request: { headers: { authorization?: string } },
    payload: CognitoAccessTokenPayload,
  ): AuthenticatedPrincipal {
    if (payload.token_use !== 'access') {
      throw new UnauthorizedException('Expected a Cognito access token');
    }

    if (payload.client_id !== this.expectedClientId) {
      throw new UnauthorizedException(
        'Token was issued for a different client',
      );
    }

    const authorization = request.headers.authorization ?? '';
    const accessToken = authorization.replace(/^Bearer\s+/i, '');
    if (!accessToken) {
      throw new UnauthorizedException('Bearer token is missing');
    }

    return {
      sub: payload.sub,
      username: payload.username,
      accessToken,
    };
  }
}
