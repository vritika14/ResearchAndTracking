// apps/api/src/modules/enum/repositories/enum.repository.ts
import { Injectable } from '@nestjs/common';
import { enumTable } from '@research-tracker/migrations';
import { and, asc, eq, inArray, or, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class EnumRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByCategory(category: string) {
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(eq(enumTable.category, category))
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
  async findPipelineStagesForTenant(tenantId: string) {
    return this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.category, 'pipeline_stage'),
          or(isNull(enumTable.tenantId), eq(enumTable.tenantId, tenantId)),
        ),
      )
      .orderBy(asc(enumTable.sortOrder));
  }
  async findPipelineStageById(tenantId: string, id: string) {
    const [row] = await this.drizzle.db
      .select()
      .from(enumTable)
      .where(
        and(
          eq(enumTable.id, id),
          eq(enumTable.category, 'pipeline_stage'),
          eq(enumTable.tenantId, tenantId),
        ),
      );
    return row;
  }
  async createTenantPipelineStage(
    tenantId: string,
    value: string,
    sortOrder: number,
  ) {
    const [row] = await this.drizzle.db
      .insert(enumTable)
      .values({ tenantId, category: 'pipeline_stage', value, sortOrder })
      .returning();
    return row;
  }

  async updateTenantPipelineStage(
    tenantId: string,
    id: string,
    values: Partial<{ value: string; sortOrder: number }>,
  ) {
    const [row] = await this.drizzle.db
      .update(enumTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(enumTable.id, id),
          eq(enumTable.tenantId, tenantId),
          eq(enumTable.category, 'pipeline_stage'),
        ),
      )
      .returning();
    return row;
  }

  async deleteTenantPipelineStage(tenantId: string, id: string) {
    const [row] = await this.drizzle.db
      .delete(enumTable)
      .where(
        and(
          eq(enumTable.id, id),
          eq(enumTable.tenantId, tenantId),
          eq(enumTable.category, 'pipeline_stage'),
        ),
      )
      .returning();
    return row;
  }
}
