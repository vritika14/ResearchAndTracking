import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { users } from '@research-tracker/migrations';
import { eq } from 'drizzle-orm';
import { firstValueFrom } from 'rxjs';
import { DrizzleService } from '../../db/drizzle.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

interface CognitoUserInfo {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  preferred_username?: string;
  username?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {}

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

  async findOrProvisionFromAccessToken(
    externalAuthId: string,
    accessToken: string,
  ) {
    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.externalAuthId, externalAuthId));

    // Existing correctly provisioned users do not require a network call on every request.
    if (existing && !existing.email.endsWith('@pending.local')) {
      return existing;
    }

    const profile = await this.fetchCognitoUserInfo(accessToken);
    if (profile.sub !== externalAuthId) {
      throw new UnauthorizedException(
        'Cognito profile does not match the access token',
      );
    }

    const email = profile.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException(
        'Cognito did not return an email. Ensure the app client requests the email scope.',
      );
    }

    const displayName: string =
      profile.name?.trim() ||
      profile.preferred_username?.trim() ||
      profile.username?.trim() ||
      email.split('@')[0] ||
      email;

    if (existing) {
      const [updated] = await this.drizzle.db
        .update(users)
        .set({ email, displayName, updatedAt: new Date() })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }

    const [sameEmail] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (
      sameEmail?.externalAuthId &&
      sameEmail.externalAuthId !== externalAuthId
    ) {
      throw new ConflictException(
        'This email is already linked to another identity',
      );
    }

    if (sameEmail) {
      const [linked] = await this.drizzle.db
        .update(users)
        .set({
          externalAuthId,
          displayName,
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(users.id, sameEmail.id))
        .returning();
      return linked;
    }

    const [created] = await this.drizzle.db
      .insert(users)
      .values({
        externalAuthId,
        email,
        displayName,
        status: 'active',
      })
      .returning();

    return created;
  }

  async updateProfile(userId: string, input: UpdateProfileDto) {
    const optionalText = (value: string | undefined) => {
      if (value === undefined) return undefined;
      return value.trim() || null;
    };

    const [updated] = await this.drizzle.db
      .update(users)
      .set({
        displayName: input.displayName?.trim(),
        jobTitle: optionalText(input.jobTitle),
        institution: optionalText(input.institution),
        department: optionalText(input.department),
        phone: optionalText(input.phone),
        researchInterests: optionalText(input.researchInterests),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }

  private async fetchCognitoUserInfo(accessToken: string) {
    const domain = this.configService.getOrThrow<string>('COGNITO_DOMAIN');

    try {
      const response = await firstValueFrom(
        this.http.get<CognitoUserInfo>(`https://${domain}/oauth2/userInfo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000,
        }),
      );
      return response.data;
    } catch {
      throw new UnauthorizedException(
        'Unable to load the authenticated Cognito profile',
      );
    }
  }
}
