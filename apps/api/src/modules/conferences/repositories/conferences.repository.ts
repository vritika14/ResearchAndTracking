import { Injectable } from '@nestjs/common';
import {
  conferenceProjects,
  conferences,
  enumTable,
  projectCollaborators,
  projects,
} from '@research-tracker/migrations';
import { and, eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

interface CreateConferenceValues {
  tenantId: string;
  ownerUserId: string;
  acronym: string;
  name: string;
  location: string;
  submissionDue: string;
  startDate: string;
  endDate: string;
  submissionType?: string;
}

interface UpdateConferenceValues {
  acronym?: string;
  name?: string;
  location?: string;
  submissionDue?: string;
  startDate?: string;
  endDate?: string;
  submissionType?: string;
}

@Injectable()
export class ConferencesRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  /**
   * Lists conferences visible to the caller.
   *
   * A conference is visible when the caller is a collaborator on at least
   * one project linked to the conference. Project owners are also stored in
   * project_collaborators, so this covers owners and collaborators.
   */
  async findVisibleByUser(tenantId: string, userId: string) {
    const rows = await this.drizzle.db
      .selectDistinct({
        conference: conferences,
      })
      .from(conferences)
      .innerJoin(
        conferenceProjects,
        and(
          eq(conferenceProjects.conferenceId, conferences.id),
          eq(conferenceProjects.tenantId, tenantId),
        ),
      )
      .innerJoin(
        projectCollaborators,
        and(
          eq(projectCollaborators.projectId, conferenceProjects.projectId),
          eq(projectCollaborators.tenantId, tenantId),
          eq(projectCollaborators.userId, userId),
        ),
      )
      .where(eq(conferences.tenantId, tenantId));

    return rows.map((row) => row.conference);
  }

  /**
   * Finds one conference only when the caller has access through one of its
   * linked projects.
   */
  async findVisibleById(
    tenantId: string,
    conferenceId: string,
    userId: string,
  ) {
    const [row] = await this.drizzle.db
      .selectDistinct({
        conference: conferences,
      })
      .from(conferences)
      .innerJoin(
        conferenceProjects,
        and(
          eq(conferenceProjects.conferenceId, conferences.id),
          eq(conferenceProjects.tenantId, tenantId),
        ),
      )
      .innerJoin(
        projectCollaborators,
        and(
          eq(projectCollaborators.projectId, conferenceProjects.projectId),
          eq(projectCollaborators.tenantId, tenantId),
          eq(projectCollaborators.userId, userId),
        ),
      )
      .where(
        and(
          eq(conferences.tenantId, tenantId),
          eq(conferences.id, conferenceId),
        ),
      );

    return row?.conference;
  }

  /**
   * Returns projects that exist inside the requested tenant.
   *
   * This is used before linking projects to a conference.
   */
  async findProjectsByIds(tenantId: string, projectIds: string[]) {
    if (projectIds.length === 0) {
      return [];
    }

    return this.drizzle.db
      .select({
        id: projects.id,
        displayId: projects.displayId,
        title: projects.title,
        tenantId: projects.tenantId,
      })
      .from(projects)
      .where(
        and(eq(projects.tenantId, tenantId), inArray(projects.id, projectIds)),
      );
  }

  /**
   * Returns the selected projects for which the caller has the Owner role.
   */
  async findOwnedProjectIds(
    tenantId: string,
    projectIds: string[],
    userId: string,
  ) {
    if (projectIds.length === 0) {
      return [];
    }

    const rows = await this.drizzle.db
      .selectDistinct({
        projectId: projectCollaborators.projectId,
      })
      .from(projectCollaborators)
      .innerJoin(enumTable, eq(projectCollaborators.roleId, enumTable.id))
      .where(
        and(
          eq(projectCollaborators.tenantId, tenantId),
          eq(projectCollaborators.userId, userId),
          inArray(projectCollaborators.projectId, projectIds),
          eq(enumTable.category, 'project_role'),
          eq(enumTable.value, 'Owner'),
        ),
      );

    return rows.map((row) => row.projectId);
  }

  /**
   * Returns project summaries linked to a conference.
   */
  async findLinkedProjects(tenantId: string, conferenceId: string) {
    return this.drizzle.db
      .select({
        id: projects.id,
        displayId: projects.displayId,
        title: projects.title,
      })
      .from(conferenceProjects)
      .innerJoin(projects, eq(conferenceProjects.projectId, projects.id))
      .where(
        and(
          eq(conferenceProjects.tenantId, tenantId),
          eq(conferenceProjects.conferenceId, conferenceId),
          eq(projects.tenantId, tenantId),
        ),
      );
  }

  /**
   * Creates the conference and all project links in one transaction.
   */
  async create(values: CreateConferenceValues, projectIds: string[]) {
    const [conference] = await this.drizzle.db
      .insert(conferences)
      .values(values)
      .returning();
  
    if (!conference) {
      return undefined;
    }
  
    await this.drizzle.db.insert(conferenceProjects).values(
      projectIds.map((projectId) => ({
        tenantId: values.tenantId,
        conferenceId: conference.id,
        projectId,
      })),
    );
  
    return conference;
  }

  /**
   * Updates conference metadata.
   *
   * When projectIds is supplied, all existing project links are replaced
   * inside the same transaction.
   */
  async update(
    tenantId: string,
    conferenceId: string,
    values: UpdateConferenceValues,
    projectIds?: string[],
  ) {
    const [conference] = await this.drizzle.db
      .update(conferences)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(conferences.tenantId, tenantId),
          eq(conferences.id, conferenceId),
        ),
      )
      .returning();
  
    if (!conference) {
      return undefined;
    }
  
    if (projectIds !== undefined) {
      await this.drizzle.db
        .delete(conferenceProjects)
        .where(
          and(
            eq(conferenceProjects.tenantId, tenantId),
            eq(conferenceProjects.conferenceId, conferenceId),
          ),
        );
  
      await this.drizzle.db.insert(conferenceProjects).values(
        projectIds.map((projectId) => ({
          tenantId,
          conferenceId,
          projectId,
        })),
      );
    }
  
    return conference;
  }

  /**
   * Deletes the conference.
   *
   * conference_projects rows are deleted automatically because their
   * conference foreign key uses ON DELETE CASCADE.
   */
  async remove(tenantId: string, conferenceId: string) {
    const [conference] = await this.drizzle.db
      .delete(conferences)
      .where(
        and(
          eq(conferences.tenantId, tenantId),
          eq(conferences.id, conferenceId),
        ),
      )
      .returning();

    return conference;
  }
}
