// apps/api/src/db/request-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@research-tracker/migrations';

export interface RequestContext {
  tenantId: string | null;
  userId: string | null;
  tx: NodePgDatabase<typeof schema>;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}
