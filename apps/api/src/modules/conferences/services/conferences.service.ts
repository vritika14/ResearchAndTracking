import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateConferenceDto } from '../dto/create-conference.dto';
import { UpdateConferenceDto } from '../dto/update-conference.dto';
import { ConferencesRepository } from '../repositories/conferences.repository';

@Injectable()
export class ConferencesService {
  constructor(private readonly repository: ConferencesRepository) {}

  /**
   * Lists conferences visible through projects the caller can access.
   */
  async list(tenantId: string, callerUserId: string) {
    const conferences = await this.repository.findVisibleByUser(
      tenantId,
      callerUserId,
    );

    return Promise.all(
      conferences.map((conference) =>
        this.withResponseValues(tenantId, conference),
      ),
    );
  }

  /**
   * Returns a conference only when the caller can access at least one linked
   * project.
   */
  async findOne(tenantId: string, conferenceId: string, callerUserId: string) {
    const conference = await this.repository.findVisibleById(
      tenantId,
      conferenceId,
      callerUserId,
    );

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    return this.withResponseValues(tenantId, conference);
  }

  /**
   * Creates a conference.
   *
   * The caller must be the Owner of every project being attached.
   */
  async create(
    tenantId: string,
    callerUserId: string,
    input: CreateConferenceDto,
  ) {
    this.validateDates(input.startDate, input.endDate);

    await this.validateProjectOwnership(
      tenantId,
      input.projectIds,
      callerUserId,
    );

    const conference = await this.repository.create(
      {
        tenantId,
        ownerUserId: callerUserId,
        acronym: input.acronym.trim(),
        name: input.name.trim(),
        location: input.location.trim(),
        submissionDue: input.submissionDue,
        startDate: input.startDate,
        endDate: input.endDate,
        submissionType: input.submissionType?.trim(),
      },
      input.projectIds,
    );

    if (!conference) {
      throw new NotFoundException('Failed to create conference');
    }

    return this.withResponseValues(tenantId, conference);
  }

  /**
   * Updates a conference.
   *
   * The caller must:
   * - Be able to view the conference through a linked project.
   * - Be the conference owner.
   * - Own every project in projectIds when projectIds is being changed.
   */
  async update(
    tenantId: string,
    conferenceId: string,
    callerUserId: string,
    input: UpdateConferenceDto,
  ) {
    const existing = await this.repository.findVisibleById(
      tenantId,
      conferenceId,
      callerUserId,
    );

    if (!existing) {
      throw new NotFoundException('Conference not found');
    }

    if (existing.ownerUserId !== callerUserId) {
      throw new ForbiddenException(
        'Only the conference owner can update this conference',
      );
    }

    const startDate = input.startDate ?? existing.startDate;
    const endDate = input.endDate ?? existing.endDate;

    this.validateDates(startDate, endDate);

    if (input.projectIds !== undefined) {
      await this.validateProjectOwnership(
        tenantId,
        input.projectIds,
        callerUserId,
      );
    }

    const conference = await this.repository.update(
      tenantId,
      conferenceId,
      {
        acronym: input.acronym?.trim(),
        name: input.name?.trim(),
        location: input.location?.trim(),
        submissionDue: input.submissionDue,
        startDate: input.startDate,
        endDate: input.endDate,
        submissionType: input.submissionType?.trim(),
      },
      input.projectIds,
    );

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    return this.withResponseValues(tenantId, conference);
  }

  /**
   * Deletes a conference.
   *
   * Only the user recorded as owner_user_id may delete it.
   */
  async remove(tenantId: string, conferenceId: string, callerUserId: string) {
    const existing = await this.repository.findVisibleById(
      tenantId,
      conferenceId,
      callerUserId,
    );

    if (!existing) {
      throw new NotFoundException('Conference not found');
    }

    if (existing.ownerUserId !== callerUserId) {
      throw new ForbiddenException(
        'Only the conference owner can delete this conference',
      );
    }

    const conference = await this.repository.remove(tenantId, conferenceId);

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    return {
      message: 'Conference deleted successfully',
      conference,
    };
  }

  /**
   * Confirms that:
   * - At least one project is supplied.
   * - Every project exists inside the tenant.
   * - The caller has the Owner role on every project.
   */
  private async validateProjectOwnership(
    tenantId: string,
    projectIds: string[],
    callerUserId: string,
  ) {
    const uniqueProjectIds = [...new Set(projectIds)];

    if (uniqueProjectIds.length === 0) {
      throw new BadRequestException(
        'At least one project must be linked to the conference',
      );
    }

    const projects = await this.repository.findProjectsByIds(
      tenantId,
      uniqueProjectIds,
    );

    if (projects.length !== uniqueProjectIds.length) {
      throw new NotFoundException(
        'One or more selected projects could not be found',
      );
    }

    const ownedProjectIds = await this.repository.findOwnedProjectIds(
      tenantId,
      uniqueProjectIds,
      callerUserId,
    );

    const ownedProjectIdSet = new Set(ownedProjectIds);

    const unauthorizedProjectIds = uniqueProjectIds.filter(
      (projectId) => !ownedProjectIdSet.has(projectId),
    );

    if (unauthorizedProjectIds.length > 0) {
      throw new ForbiddenException(
        'You must be the owner of every project linked to the conference',
      );
    }
  }

  /**
   * Conference end date cannot occur before the start date.
   *
   * ISO date strings use YYYY-MM-DD, so direct comparison is safe here.
   */
  private validateDates(startDate: string, endDate: string) {
    if (endDate < startDate) {
      throw new BadRequestException(
        'Conference end date cannot be before its start date',
      );
    }
  }

  /**
   * Adds values that are derived rather than stored:
   * - daysRemaining
   * - linked project summaries
   */
  private async withResponseValues<
    T extends {
      id: string;
      submissionDue: string;
    },
  >(tenantId: string, conference: T) {
    const projects = await this.repository.findLinkedProjects(
      tenantId,
      conference.id,
    );

    return {
      ...conference,
      daysRemaining: calculateDaysRemaining(conference.submissionDue),
      projects,
    };
  }
}

function calculateDaysRemaining(submissionDue: string) {
  const dueDate = new Date(`${submissionDue}T00:00:00.000Z`);
  const today = new Date();

  today.setUTCHours(0, 0, 0, 0);

  return Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}
