// apps/api/src/modules/project-collaborators/repositories/project-collaborators.repository.ts
import { Injectable } from '@nestjs/common';
import { projectCollaborators } from '@research-tracker/migrations';
import { and, eq, sql } from 'drizzle-orm';
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

  /** Every project id this user collaborates on (or owns), across every tenant. */
  async findProjectIdsByUser(userId: string) {
    const rows = await this.drizzle.db
      .select({ projectId: projectCollaborators.projectId })
      .from(projectCollaborators)
      .where(eq(projectCollaborators.userId, userId));
    return rows.map((row) => row.projectId);
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
  /**
 * Pre-context bypass, used only by guards that run before
 * RequestContextInterceptor sets app.current_user_id. Guards structurally
 * run before interceptors in NestJS, so at this point in the request
 * lifecycle, RLS-protected queries can't see any rows yet. This performs
 * the exact same check as findByProjectAndUser, just without depending on
 * session context that doesn't exist yet.
 */
async checkAccessForGuard(projectId: string, userId: string) {
  const result = await this.drizzle.db.execute(
    sql`SELECT * FROM check_project_collaborator(${projectId}::uuid, ${userId}::uuid)`,
  );
  return result.rows[0] as { id: string; roleId: string } | undefined;
}
}
