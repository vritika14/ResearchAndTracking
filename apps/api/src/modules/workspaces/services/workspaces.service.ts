import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { tenantMemberships, tenants } from '@research-tracker/migrations';
import { DrizzleService } from '../../../db/drizzle.service';
import { WorkspacesRepository } from '../repositories/workspaces.repository';

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly repository: WorkspacesRepository,
    private readonly drizzle: DrizzleService,
  ) {}

  async createWorkspace(ownerUserId: string, name: string) {
    const existing = await this.repository.findByOwnerUserId(ownerUserId);
    if (existing) {
      throw new ConflictException('You already own a workspace');
    }

    const slug = `${slugify(name)}-${Date.now()}`;

    return this.drizzle.db.transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({
          name,
          slug,
          ownerUserId,
          status: 'active',
        })
        .returning();

      if (!tenant) {
        throw new ConflictException('Failed to create workspace');
      }

      await tx.insert(tenantMemberships).values({
        tenantId: tenant.id,
        userId: ownerUserId,
        role: 'owner',
        status: 'active',
        invitedAt: new Date(),
        joinedAt: new Date(),
      });

      return tenant;
    });
  }

  async getCurrentWorkspace(userId: string) {
    const tenant = await this.repository.findByMemberUserId(userId);
    if (!tenant) {
      throw new NotFoundException('You do not belong to any workspace yet');
    }
    return tenant;
  }
}
