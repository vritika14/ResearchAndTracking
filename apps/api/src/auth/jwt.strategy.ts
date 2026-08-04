import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

interface CognitoAccessTokenPayload {
  sub: string;
  token_use: string;
  scope?: string;
  username?: string;
  [key: string]: unknown;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const region = configService.getOrThrow<string>('COGNITO_REGION');
    const userPoolId = configService.getOrThrow<string>('COGNITO_USER_POOL_ID');
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    super({
      jwtFromRequest: (req: { headers: { authorization?: string } }) =>
        req.headers.authorization?.replace('Bearer ', '') ?? null,
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}/.well-known/jwks.json`,
      }),
    });
  }

  validate(payload: CognitoAccessTokenPayload): {
    sub: string;
    username?: string;
  } {
    console.log('=== JWT validate() called ===');
    console.log(JSON.stringify(payload, null, 2));
    if (payload.token_use !== 'access') {
      throw new Error('Invalid token_use — expected an access token');
    }
    return {
      sub: payload.sub,
      username: payload.username,
    };
  }
}
