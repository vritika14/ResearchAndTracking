import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { Client } from 'pg';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly config: ConfigService,
  ) {}

  @Get('live')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  checkReadiness() {
    const minioBase = this.config
      .getOrThrow<string>('MINIO_ENDPOINT')
      .replace(/\/$/, '');

    return this.health.check([
      () => this.checkPostgres(),
      () => this.http.pingCheck('minio', `${minioBase}/minio/health/live`),
    ]);
  }

  private async checkPostgres(): Promise<HealthIndicatorResult> {
    const client = new Client({
      host: this.config.getOrThrow<string>('POSTGRES_HOST'),
      port: this.config.getOrThrow<number>('POSTGRES_PORT'),
      user: this.config.getOrThrow<string>('POSTGRES_RUNTIME_USER'),
      password: this.config.getOrThrow<string>('POSTGRES_RUNTIME_PASSWORD'),
      database: this.config.getOrThrow<string>('POSTGRES_DB'),
      ssl: this.config.get<boolean>('POSTGRES_SSL', false),
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      return { postgres: { status: 'up' } };
    } catch (error) {
      throw new Error(`Postgres check failed: ${(error as Error).message}`);
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
