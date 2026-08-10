import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { DbModule } from './db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

const invitationTokenPath = /\/api\/v1\/invitations\/[^/]+/g;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '..', '..', '.env')],
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.confirmPassword',
            'req.body.accessToken',
            'req.body.refreshToken',
            'req.body.apiKey',
            'req.body.secret',
            'res.headers["set-cookie"]',
          ],
          censor: '[Redacted]',
        },
        serializers: {
          req(req: { method?: string; url?: string; id?: string }) {
            return {
              id: req.id,
              method: req.method,
              url: req.url?.replace(
                invitationTokenPath,
                '/api/v1/invitations/[Redacted]',
              ),
            };
          },
        },
      },
    }),
    DbModule,
    AuthModule,
    UsersModule,
    MembershipsModule,
    HealthModule,
    WorkspacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
