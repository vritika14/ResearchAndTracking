// apps/api/src/db/drizzle.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as schema from '@research-tracker/migrations';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolClient } from 'pg';
import { getRequestContext } from './request-context';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private plainDb!: NodePgDatabase<typeof schema>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.pool = new Pool({
      host: this.configService.getOrThrow<string>('POSTGRES_HOST'),
      port: this.configService.getOrThrow<number>('POSTGRES_PORT'),
      user: this.configService.getOrThrow<string>('POSTGRES_RUNTIME_USER'),
      password: this.configService.getOrThrow<string>('POSTGRES_RUNTIME_PASSWORD'),
      database: this.configService.getOrThrow<string>('POSTGRES_DB'),
      ssl: this.configService.get<boolean>('POSTGRES_SSL', false)
        ? { rejectUnauthorized: false }
        : false,
    });

    this.plainDb = drizzle(this.pool, { schema });
  }

  get db(): NodePgDatabase<typeof schema> {
    const context = getRequestContext();
    return context?.tx ?? this.plainDb;
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
