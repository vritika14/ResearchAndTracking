// apps/api/src/modules/enum/repositories/enum.repository.ts
import { Injectable } from '@nestjs/common';
import { enumTable } from '@research-tracker/migrations';
import { and, asc, eq, inArray } from 'drizzle-orm';
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
}
