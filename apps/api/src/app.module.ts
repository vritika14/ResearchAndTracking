import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from 'nestjs-pino';
import { envValidationSchema } from './config/env.validation';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { DbModule } from './db/db.module';
import { UsersModule } from './modules/users/users.module';
import { MembershipsModule } from './modules/memberships/memberships.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '..', '..', '.env')],
      validationSchema: envValidationSchema,
    }),
    HealthModule,
    AuthModule,
    DbModule,
    UsersModule,
    MembershipsModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["set-cookie"]',
            'req.body.*.password',
            '*.token',
            'req.body.accesstoken',
            'req.body.refreshtoken',
            'req.body.apikey',
            'req.body.secret',
            'res.headers["set-cookie"]',
          ],
          censor: '[Redacted]',
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
