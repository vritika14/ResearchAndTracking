// apps/api/src/modules/project-collaborators/repositories/project-collaborators.repository.ts
import { Injectable } from '@nestjs/common';
import { projectCollaborators } from '@research-tracker/migrations';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class ProjectCollaboratorsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByProject(tenantId: string, projectId: string) {
    return this.drizzle.db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.tenantId, tenantId),
          eq(projectCollaborators.projectId, projectId),
        ),
      );
  }

  async findByProjectAndUser(
    tenantId: string,
    projectId: string,
    userId: string,
  ) {
    const [row] = await this.drizzle.db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.tenantId, tenantId),
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId),
        ),
      );
    return row;
  }

  async create(values: {
    tenantId: string;
    projectId: string;
    userId: string;
    roleId: string;
  }) {
    const [row] = await this.drizzle.db
      .insert(projectCollaborators)
      .values(values)
      .returning();
    return row;
  }

  async updateRole(
    tenantId: string,
    projectId: string,
    userId: string,
    roleId: string,
  ) {
    const [row] = await this.drizzle.db
      .update(projectCollaborators)
      .set({ roleId, updatedAt: new Date() })
      .where(
        and(
          eq(projectCollaborators.tenantId, tenantId),
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId),
        ),
      )
      .returning();
    return row;
  }

  async delete(tenantId: string, projectId: string, userId: string) {
    const [row] = await this.drizzle.db
      .delete(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.tenantId, tenantId),
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId),
        ),
      )
      .returning();
    return row;
  }
}
