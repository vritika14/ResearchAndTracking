import { Injectable } from '@nestjs/common';
import { modulePipelineSelections } from '@research-tracker/migrations';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class ModulePipelineSelectionsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByModule(moduleId: string) {
    return this.drizzle.db
      .select()
      .from(modulePipelineSelections)
      .where(eq(modulePipelineSelections.moduleId, moduleId));
  }

  async replaceSelection(moduleId: string, enumIds: string[]) {
    await this.drizzle.db
      .delete(modulePipelineSelections)
      .where(eq(modulePipelineSelections.moduleId, moduleId));

    if (enumIds.length === 0) return [];

    return this.drizzle.db
      .insert(modulePipelineSelections)
      .values(enumIds.map((enumId) => ({ moduleId, enumId })))
      .returning();
  }
}
