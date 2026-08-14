// apps/api/src/modules/enum/repositories/enum.repository.ts
import { Injectable } from '@nestjs/common';
import { enumTable } from '@research-tracker/migrations';
import { and, asc, eq } from 'drizzle-orm';
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
}
