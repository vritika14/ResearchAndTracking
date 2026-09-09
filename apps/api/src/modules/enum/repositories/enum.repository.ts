// apps/api/src/modules/enum/repositories/enum.repository.ts
import { Injectable } from '@nestjs/common';
import { enumTable } from '@research-tracker/migrations';
import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class EnumRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  /**
   * `tenantId` scopes the pool to shared system defaults (tenantId IS NULL)
   * plus this tenant's own custom additions. Omitting it keeps the old
   * behavior (defaults only) — safe for categories that never get
   * tenant-scoped rows (status, importance, role, etc.).
   */
  async findByCategory(category: string, tenantId?: string) {
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, category),
          isNull(enumTable.projectId),
          isNull(enumTable.moduleId),
          tenantId
            ? or(isNull(enumTable.tenantId), eq(enumTable.tenantId, tenantId))
            : isNull(enumTable.tenantId),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
  }

  async findByCategoryAndValue(category: string, value: string) {
    const [result] = await this.drizzle.db
      .select()
      .from(enumTable)
      .where(and(eq(enumTable.category, category), eq(enumTable.value, value)));
    return result;
  }

  async findValuesByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await this.drizzle.db
      .select({ id: enumTable.id, value: enumTable.value })
      .from(enumTable)
      .where(inArray(enumTable.id, ids));
    return new Map(rows.map((row) => [row.id, row.value]));
  }

  // ============================================================
  // Paper (module) pipeline stages — one fixed, 15-value catalog per
  // workspace. The global rows (tenantId IS NULL) are the immutable
  // catalog; a tenant gets its own copy (tenantId set) the first time it
  // reorders or hides a stage, and only that copy is ever mutated.
  // ============================================================

  /** The fixed global catalog, in order. Never mutated directly. */
  async findGlobalModuleStages() {
    return this.findByCategory('module_pipeline_stage');
  }

  /** This tenant's own copy, if it has materialized one yet. */
  async findTenantModuleStages(tenantId: string) {
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'module_pipeline_stage'),
          eq(enumTable.tenantId, tenantId),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
  }

  /** Tenant's own order/visibility if customized, else the global catalog. */
  async findEffectiveModuleStages(tenantId: string) {
    const tenantStages = await this.findTenantModuleStages(tenantId);
    return tenantStages.length > 0
      ? tenantStages
      : this.findGlobalModuleStages();
  }

  async findModuleStageByValueForTenant(tenantId: string, value: string) {
    const stages = await this.findEffectiveModuleStages(tenantId);
    return stages.find((stage) => stage.value === value);
  }

  /** Clones the global catalog into this tenant's own scope, if it hasn't already. */
  async materializeTenantModuleStages(tenantId: string) {
    const existing = await this.findTenantModuleStages(tenantId);
    if (existing.length > 0) return existing;

    const globalStages = await this.findGlobalModuleStages();
    if (globalStages.length === 0) return [];

    return this.drizzle.db
      .insert(enumTable)
      .values(
        globalStages.map((stage) => ({
          tenantId,
          category: 'module_pipeline_stage',
          value: stage.value,
          sortOrder: stage.sortOrder,
          hidden: stage.hidden,
        })),
      )
      .returning();
  }

  /**
   * Every request already runs inside its own outer transaction (see
   * RequestContextInterceptor), so this deliberately does NOT open a nested
   * `.transaction()` — Postgres doesn't support that on the same connection.
   * The sequential updates below share the request's existing transaction.
   */
  async reorderTenantModuleStages(tenantId: string, orderedValues: string[]) {
    for (const [index, value] of orderedValues.entries()) {
      await this.drizzle.db
        .update(enumTable)
        .set({ sortOrder: index + 1, updatedAt: new Date() })
        .where(
          and(
            eq(enumTable.tenantId, tenantId),
            eq(enumTable.category, 'module_pipeline_stage'),
            eq(enumTable.value, value),
          ),
        );
    }
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.tenantId, tenantId),
          eq(enumTable.category, 'module_pipeline_stage'),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
  }

  async setTenantModuleStageHidden(
    tenantId: string,
    value: string,
    hidden: boolean,
  ) {
    const [row] = await this.drizzle.db
      .update(enumTable)
      .set({ hidden, updatedAt: new Date() })
      .where(
        and(
          eq(enumTable.tenantId, tenantId),
          eq(enumTable.category, 'module_pipeline_stage'),
          eq(enumTable.value, value),
        ),
      )
      .returning();
    return row;
  }

  /** Deletes this tenant's customization — reads fall back to the global catalog again. */
  async resetTenantModuleStages(tenantId: string) {
    await this.drizzle.db
      .delete(enumTable)
      .where(
        and(
          eq(enumTable.tenantId, tenantId),
          eq(enumTable.category, 'module_pipeline_stage'),
        ),
      );
  }
}
