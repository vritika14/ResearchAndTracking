/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { users } from '@research-tracker/migrations';

@Injectable()
export class UsersService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByExternalAuthId(externalAuthId: string) {
    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.externalAuthId, externalAuthId));

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    return existing;
  }

  async findOrProvisionByExternalAuthId(externalAuthId: string) {
    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.externalAuthId, externalAuthId));

    if (existing) return existing;

    // TODO(tech debt): access tokens don't carry email, so brand-new users get
    // a placeholder here. Needs a real fix later — e.g. validating the ID token
    // too, or making users.email nullable and filling it in via a profile-setup step.
    const placeholderEmail = `${externalAuthId}@pending.local`;

    const [created] = await this.drizzle.db
      .insert(users)
      .values({
        externalAuthId,
        email: placeholderEmail,
        displayName: 'New User',
        status: 'active',
      })
      .returning();

    return created;
  }
}
