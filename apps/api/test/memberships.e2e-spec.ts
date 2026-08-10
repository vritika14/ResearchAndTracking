import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  tenantMemberships,
  tenants,
  users,
} from '@research-tracker/migrations';
import { eq, sql, and } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DrizzleService } from '../src/db/drizzle.service';
import { getTestAccessToken } from './helpers/cognito';

function getJwtSub(token: string) {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('Invalid JWT returned by Cognito');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).sub as string;
}

describe('Memberships (e2e)', () => {
  let app: INestApplication<App>;
  let drizzle: DrizzleService;

  let ownerToken: string;
  let limitedMemberToken: string;
  let otherTenantOwnerToken: string;
  let acceptanceToken: string;

  let ownerUserId: string;
  let limitedMemberUserId: string;
  let otherTenantOwnerUserId: string;
  let tenantAId: string;
  let tenantBId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    drizzle = moduleFixture.get(DrizzleService);

    // These optional smoke tests use a real dev Cognito pool. AdminInitiateAuth
    // tokens cannot call /oauth2/userInfo, so seed the internal user rows from
    // the validated token subjects instead of using /api/v1/me here.
    ownerToken = await getTestAccessToken('test@example.com', 'DevTest2026#pw');
    limitedMemberToken = await getTestAccessToken(
      'limited-member@example.com',
      'DevTest2026pw-2',
    );
    otherTenantOwnerToken = await getTestAccessToken(
      'other-tenant-owner@example.com',
      'DevTest2026pw-3',
    );

    const seededUsers = await drizzle.db
      .insert(users)
      .values([
        {
          email: 'test@example.com',
          displayName: 'Owner',
          externalAuthId: getJwtSub(ownerToken),
          status: 'active',
        },
        {
          email: 'limited-member@example.com',
          displayName: 'Limited Member',
          externalAuthId: getJwtSub(limitedMemberToken),
          status: 'active',
        },
        {
          email: 'other-tenant-owner@example.com',
          displayName: 'Other Owner',
          externalAuthId: getJwtSub(otherTenantOwnerToken),
          status: 'active',
        },
      ])
      .onConflictDoUpdate({
        target: users.externalAuthId,
        set: {
          email: sql`excluded.email`,
          displayName: sql`excluded.display_name`,
          updatedAt: new Date(),
        },
      })
      .returning();

    const findSeededUser = async (externalAuthId: string) => {
      const [row] = await drizzle.db
        .select()
        .from(users)
        .where(eq(users.externalAuthId, externalAuthId));
      if (!row) throw new Error(`Unable to seed test user ${externalAuthId}`);
      return row;
    };

    const owner =
      seededUsers.find((u) => u.externalAuthId === getJwtSub(ownerToken)) ??
      (await findSeededUser(getJwtSub(ownerToken)));
    const limited =
      seededUsers.find(
        (u) => u.externalAuthId === getJwtSub(limitedMemberToken),
      ) ?? (await findSeededUser(getJwtSub(limitedMemberToken)));
    const other =
      seededUsers.find(
        (u) => u.externalAuthId === getJwtSub(otherTenantOwnerToken),
      ) ?? (await findSeededUser(getJwtSub(otherTenantOwnerToken)));

    ownerUserId = owner.id;
    limitedMemberUserId = limited.id;
    otherTenantOwnerUserId = other.id;

    const [tenantA] = await drizzle.db
      .insert(tenants)
      .values({
        name: 'Tenant A (Memberships Test)',
        slug: `tenant-a-membership-test-${Date.now()}`,
        ownerUserId,
        status: 'active',
      })
      .returning();
    tenantAId = tenantA!.id;

    const [tenantB] = await drizzle.db
      .insert(tenants)
      .values({
        name: 'Tenant B (Isolation Test)',
        slug: `tenant-b-isolation-test-${Date.now()}`,
        ownerUserId: otherTenantOwnerUserId,
        status: 'active',
      })
      .returning();
    tenantBId = tenantB!.id;

    await drizzle.db.insert(tenantMemberships).values([
      {
        tenantId: tenantAId,
        userId: ownerUserId,
        role: 'owner',
        status: 'active',
        invitedAt: new Date(),
        joinedAt: new Date(),
      },
      {
        tenantId: tenantBId,
        userId: otherTenantOwnerUserId,
        role: 'owner',
        status: 'active',
        invitedAt: new Date(),
        joinedAt: new Date(),
      },
    ]);
  });

  afterAll(async () => {
    if (tenantAId) await drizzle.db.delete(tenants).where(eq(tenants.id, tenantAId));
    if (tenantBId) await drizzle.db.delete(tenants).where(eq(tenants.id, tenantBId));
    await app.close();
  });

  it('owner creates one limited-member invitation and receives the raw token once', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/tenant/${tenantAId}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'limited-member@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.invitation.role).toBe('limited_member');
    expect(res.body.invitation.email).toBe('limited-member@example.com');
    expect(res.body.invitation.token).toBeUndefined();
    expect(typeof res.body.acceptanceToken).toBe('string');
    acceptanceToken = res.body.acceptanceToken;
  });

  it('previews the invitation without exposing the full invited email', async () => {
    const res = await request(app.getHttpServer()).get(
      `/api/v1/invitations/${acceptanceToken}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.workspaceName).toContain('Tenant A');
    expect(res.body.invitedEmail).not.toBe('limited-member@example.com');
  });

  it('rejects acceptance by the wrong authenticated email', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/invitations/${acceptanceToken}/accept`)
      .set('Authorization', `Bearer ${otherTenantOwnerToken}`);

    expect(res.status).toBe(403);
  });

  it('accepts the invitation for the invited user', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/invitations/${acceptanceToken}/accept`)
      .set('Authorization', `Bearer ${limitedMemberToken}`);

    expect(res.status).toBe(201);
    expect(res.body.membership.role).toBe('limited_member');
    expect(res.body.membership.status).toBe('active');
  });

  it('blocks an unrelated tenant user from listing Tenant A members', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/tenant/${tenantAId}/members`)
      .set('Authorization', `Bearer ${otherTenantOwnerToken}`);

    expect(res.status).toBe(403);
  });

  it('prevents the primary owner membership from being revoked', async () => {
    const [ownerMembership] = await drizzle.db
      .select()
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.userId, ownerUserId),
          eq(tenantMemberships.tenantId, tenantAId),
        ),
      );

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/tenant/${tenantAId}/members/${ownerMembership!.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
  });

  it('allows the owner to revoke the limited member', async () => {
    const [membership] = await drizzle.db
      .select()
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.userId, limitedMemberUserId),
          eq(tenantMemberships.tenantId, tenantAId),
        ),
      );

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/tenant/${tenantAId}/members/${membership!.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('revoked');
  });
});
