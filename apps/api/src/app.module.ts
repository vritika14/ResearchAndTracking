import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    HealthModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["set-cookie"]',
            'req.body.passowrd',
            'req.body.confirmpassword',
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
