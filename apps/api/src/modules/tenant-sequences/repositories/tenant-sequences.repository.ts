// apps/api/src/modules/tenant-sequences/repositories/tenant-sequences.repository.ts
import { Injectable } from '@nestjs/common';
import { tenantSequences } from '@research-tracker/migrations';
import { and, eq, sql } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

const PREFIXES: Record<string, string> = {
  project: 'PRJ',
  module: 'MOD',
  task: 'TSK',
  note: 'NTE',
};

@Injectable()
export class TenantSequencesRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async nextDisplayId(tenantId: string, entityType: string): Promise<string> {
    const prefix = PREFIXES[entityType];
    if (!prefix) {
      throw new Error(
        `No display-id prefix configured for entity type "${entityType}"`,
      );
    }

    await this.drizzle.db
      .insert(tenantSequences)
      .values({ tenantId, entityType, lastValue: 0 })
      .onConflictDoNothing();

    const [row] = await this.drizzle.db
      .update(tenantSequences)
      .set({
        lastValue: sql`${tenantSequences.lastValue} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenantSequences.tenantId, tenantId),
          eq(tenantSequences.entityType, entityType),
        ),
      )
      .returning();

    if (!row) {
      throw new Error('Failed to generate a display ID');
    }

    return `${prefix}-${String(row.lastValue).padStart(4, '0')}`;
  }
}
