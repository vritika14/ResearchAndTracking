import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { eq } from 'drizzle-orm';
import {
  tenants,
  tenantMemberships,
  invitations,
} from '@research-tracker/migrations';
import { AppModule } from '../src/app.module';
import { DrizzleService } from '../src/db/drizzle.service';
import { getTestAccessToken } from './helpers/cognito';


describe('Memberships (e2e)', () => {
  let app: INestApplication<App>;
  let drizzle: DrizzleService;

  let ownerToken: string;
  let limitedMemberToken: string;
  let otherTenantOwnerToken: string;

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

    drizzle = moduleFixture.get<DrizzleService>(DrizzleService);

    // Get real Cognito tokens for all three test users
    ownerToken = await getTestAccessToken('test@example.com', 'DevTest2026#pw');
    limitedMemberToken = await getTestAccessToken(
      'limited-member@example.com',
      'DevTest2026pw-2',
    );
    otherTenantOwnerToken = await getTestAccessToken(
      'other-tenant-owner@example.com',
      'DevTest2026pw-3',
    );

    // Hit /api/v1/me for each, to trigger JIT provisioning and get their internal user IDs
    const ownerMeRes = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${ownerToken}`);
    ownerUserId = ownerMeRes.body.id;

    const limitedMemberMeRes = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${limitedMemberToken}`);
    limitedMemberUserId = limitedMemberMeRes.body.id;

    const otherOwnerMeRes = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${otherTenantOwnerToken}`);
    otherTenantOwnerUserId = otherOwnerMeRes.body.id;

    // Seed two tenants directly (no "create tenant" endpoint exists yet)
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

    // Seed the owner's membership in Tenant A (the invite/accept flow will create the limited_member's)
    await drizzle.db.insert(tenantMemberships).values({
      tenantId: tenantAId,
      userId: ownerUserId,
      role: 'owner',
      status: 'active',
      invitedAt: new Date(),
      joinedAt: new Date(),
    });

    // Seed the other owner's membership in Tenant B
    await drizzle.db.insert(tenantMemberships).values({
      tenantId: tenantBId,
      userId: otherTenantOwnerUserId,
      role: 'owner',
      status: 'active',
      invitedAt: new Date(),
      joinedAt: new Date(),
    });
  });

  afterAll(async () => {
    // Cascading deletes handle tenant_memberships and invitations automatically
    await drizzle.db.delete(tenants).where(eq(tenants.id, tenantAId));
    await drizzle.db.delete(tenants).where(eq(tenants.id, tenantBId));
    await app.close();
  });

  describe('POST /api/v1/tenant/:tenantId/invitations', () => {
    it('allows the owner to invite a new member', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenant/${tenantAId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: 'limited-member@example.com', role: 'limited_member' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
      expect(res.body.email).toBe('limited-member@example.com');
    });

    it('rejects a duplicate pending invitation for the same email', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenant/${tenantAId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: 'limited-member@example.com', role: 'limited_member' });

      expect(res.status).toBe(409);
    });

    it('rejects invitation attempts from a non-owner', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenant/${tenantAId}/invitations`)
        .set('Authorization', `Bearer ${otherTenantOwnerToken}`)
        .send({ email: 'someone-else@example.com', role: 'limited_member' });

      expect(res.status).toBe(403);
    });

    it('rejects an invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenant/${tenantAId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: 'not-an-email', role: 'limited_member' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/tenant/:tenantId/invitations/:token/accept', () => {
    it('accepts a valid invitation and creates a membership', async () => {
      const [invitation] = await drizzle.db
        .select()
        .from(invitations)
        .where(eq(invitations.email, 'limited-member@example.com'));

      const res = await request(app.getHttpServer())
        .post(
          `/api/v1/tenant/${tenantAId}/invitations/${invitation!.token}/accept`,
        )
        .set('Authorization', `Bearer ${limitedMemberToken}`)
        .send();

      expect(res.status).toBe(201);
      expect(res.body.membership.role).toBe('limited_member');
      expect(res.body.membership.status).toBe('active');
    });

    it('rejects an already-accepted invitation token', async () => {
      const [invitation] = await drizzle.db
        .select()
        .from(invitations)
        .where(eq(invitations.email, 'limited-member@example.com'));

      const res = await request(app.getHttpServer())
        .post(
          `/api/v1/tenant/${tenantAId}/invitations/${invitation!.token}/accept`,
        )
        .set('Authorization', `Bearer ${limitedMemberToken}`)
        .send();

      expect(res.status).toBe(410);
    });

    it('rejects an unknown token', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenant/${tenantAId}/invitations/not-a-real-token/accept`)
        .set('Authorization', `Bearer ${limitedMemberToken}`)
        .send();

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/tenant/:tenantId/members', () => {
    it('allows the owner to list members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenant/${tenantAId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('allows a limited_member to list members too', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenant/${tenantAId}/members`)
        .set('Authorization', `Bearer ${limitedMemberToken}`);

      expect(res.status).toBe(200);
    });

    it('rejects a user from a different tenant entirely', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenant/${tenantAId}/members`)
        .set('Authorization', `Bearer ${otherTenantOwnerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/tenant/:tenantId/members/:membershipId', () => {
    it('rejects revocation attempts from a non-owner', async () => {
      const [membership] = await drizzle.db
        .select()
        .from(tenantMemberships)
        .where(eq(tenantMemberships.userId, limitedMemberUserId));

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/tenant/${tenantAId}/members/${membership!.id}`)
        .set('Authorization', `Bearer ${limitedMemberToken}`);

      expect(res.status).toBe(403);
    });

    it('rejects a cross-tenant revocation attempt, even with a guessed valid membershipId', async () => {
      const [membership] = await drizzle.db
        .select()
        .from(tenantMemberships)
        .where(eq(tenantMemberships.userId, limitedMemberUserId));

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/tenant/${tenantBId}/members/${membership!.id}`)
        .set('Authorization', `Bearer ${otherTenantOwnerToken}`);

      expect(res.status).toBe(404);
    });

    it('allows the owner to revoke a member', async () => {
      const [membership] = await drizzle.db
        .select()
        .from(tenantMemberships)
        .where(eq(tenantMemberships.userId, limitedMemberUserId));

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/tenant/${tenantAId}/members/${membership!.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('revoked');
    });
  });
});
