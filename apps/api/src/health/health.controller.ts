import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
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
    return this.health.check([
      () => this.checkPostgres(),
      () => this.http.pingCheck('minio', this.config.getOrThrow('MINIO_ENDPOINT')),
    ]);
  }

  //opens a new connection to the Postgres database, runs a simple query, and returns the result. If the connection or query fails, it throws an error with a message indicating the failure.
  private async checkPostgres(): Promise<HealthIndicatorResult> {
    const client = new Client({
      host: this.config.getOrThrow('POSTGRES_HOST'),
      port: this.config.get<number>('POSTGRES_PORT'),
      user: this.config.get<string>('POSTGRES_USER'),
      password: this.config.get<string>('POSTGRES_PASSWORD'),
      database: this.config.get<string>('POSTGRES_DB'),
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return { postgres: { status: 'up' } };
    } catch (error) {
      await client.end().catch(() => undefined);
      throw new Error(`Postgres check failed: ${(error as Error).message}`);
    }
  }
}
