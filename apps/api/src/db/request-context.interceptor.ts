// apps/api/src/db/request-context.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Observable, from } from 'rxjs';
import * as schema from '@research-tracker/migrations';
import { DrizzleService } from './drizzle.service';
import { requestContextStorage } from './request-context';
import { UsersService } from '../modules/users/users.service';
import type { AuthenticatedPrincipal } from '../modules/auth/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedPrincipal;
}

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly usersService: UsersService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return from(this.handle(context, next));
  }

  private async handle(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse();

    const tenantIdMatch = req.originalUrl.match(/\/tenant\/([^/]+)/);
    const tenantId = tenantIdMatch?.[1] ?? null;

    // req.user only exists here because JwtAuthGuard already ran and
    // cryptographically verified the token — this interceptor runs AFTER
    // guards, so we only ever trust an identity that's already been proven
    // genuine. Never decode the raw JWT ourselves here.
    let userId: string | null = null;
    if (req.user?.sub) {
      const user = await this.usersService
        .findByExternalAuthId(req.user.sub)
        .catch(() => undefined);
      userId = user?.id ?? null;
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
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      client.release();
      throw err;
    }

    return new Promise((resolve, reject) => {
      requestContextStorage.run({ tenantId, userId, tx }, () => {
        next.handle().subscribe({
          next: (value) => {
            res.on('finish', () => {
              const isError = res.statusCode >= 400;
              client
                .query(isError ? 'ROLLBACK' : 'COMMIT')
                .catch(() => undefined)
                .finally(() => client.release());
            });
            resolve(value);
          },
          error: (err) => {
            client
              .query('ROLLBACK')
              .catch(() => undefined)
              .finally(() => client.release());
            reject(err);
          },
        });
      });
    });
  }
}
