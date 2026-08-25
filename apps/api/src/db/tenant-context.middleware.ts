// apps/api/src/db/tenant-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@research-tracker/migrations';
import { DrizzleService } from './drizzle.service';
import { requestContextStorage } from './request-context';
import { UsersService } from '../modules/users/users.service';

function decodeJwtSub(token: string): string | undefined {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return undefined;
    const payload = JSON.parse(
      Buffer.from(payloadSegment, 'base64').toString('utf-8'),
    ) as {
      sub?: string;
    };
    return payload.sub;
  } catch {
    return undefined;
  }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const tenantIdMatch = req.originalUrl.match(/\/tenant\/([^/]+)/);
    const tenantId = tenantIdMatch?.[1] ?? null;

    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      const sub = decodeJwtSub(token);
      if (sub) {
        const user = await this.usersService
          .findByExternalAuthId(sub)
          .catch(() => undefined);
        userId = user?.id ?? null;
      }
    }

    const client = await this.drizzle.getClient();
    const tx = drizzle(client, { schema });

    try {
      await client.query('BEGIN');
      if (tenantId) {
        await client.query('SELECT set_config($1, $2, true)', [
          'app.current_tenant_id',
          tenantId,
        ]);
      }
      if (userId) {
        await client.query('SELECT set_config($1, $2, true)', [
          'app.current_user_id',
          userId,
        ]);
      }

      requestContextStorage.run({ tenantId, userId, tx }, () => {
        res.on('finish', () => {
          const isError = res.statusCode >= 400;
          client
            .query(isError ? 'ROLLBACK' : 'COMMIT')
            .catch(() => undefined)
            .finally(() => client.release());
        });
        next();
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      client.release();
      next(err);
    }
  }
}
