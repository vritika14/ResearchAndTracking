// apps/api/src/modules/project-pipeline-stages/repositories/project-pipeline-selections.repository.ts
import { Injectable } from '@nestjs/common';
import { projectPipelineSelections } from '@research-tracker/migrations';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class ProjectPipelineSelectionsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByProject(projectId: string) {
    return this.drizzle.db
      .select()
      .from(projectPipelineSelections)
      .where(eq(projectPipelineSelections.projectId, projectId));
  }

  async replaceSelection(projectId: string, enumIds: string[]) {
    await this.drizzle.db
      .delete(projectPipelineSelections)
      .where(eq(projectPipelineSelections.projectId, projectId));

    if (enumIds.length === 0) return [];

    return this.drizzle.db
      .insert(projectPipelineSelections)
      .values(enumIds.map((enumId) => ({ projectId, enumId })))
      .returning();
  }
}
