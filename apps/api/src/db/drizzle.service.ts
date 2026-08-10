import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as schema from '@research-tracker/migrations';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  public db!: NodePgDatabase<typeof schema>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.pool = new Pool({
      host: this.configService.getOrThrow<string>('POSTGRES_HOST'),
      port: this.configService.getOrThrow<number>('POSTGRES_PORT'),
      user: this.configService.getOrThrow<string>('POSTGRES_RUNTIME_USER'),
      password: this.configService.getOrThrow<string>(
        'POSTGRES_RUNTIME_PASSWORD',
      ),
      database: this.configService.getOrThrow<string>('POSTGRES_DB'),
      ssl: this.configService.get<boolean>('POSTGRES_SSL', false),
    });

    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
