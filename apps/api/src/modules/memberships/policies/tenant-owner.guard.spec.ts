import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantOwnerGuard } from './tenant-owner.guard';
import { UsersService } from '../../users/users.service';
import { MembershipsRepository } from '../repositories/memberships.repository';

describe('TenantOwnerGuard', () => {
  let guard: TenantOwnerGuard;
  let usersService: { findByExternalAuthId: jest.Mock };
  let repository: { findMembershipByTenantAndUser: jest.Mock };

  beforeEach(() => {
    usersService = { findByExternalAuthId: jest.fn() };
    repository = { findMembershipByTenantAndUser: jest.fn() };
    guard = new TenantOwnerGuard(
      usersService as unknown as UsersService,
      repository as unknown as MembershipsRepository,
    );
  });

  function mockContext(sub: string, tenantId?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub },
          params: { tenantId },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('throws if tenantId is missing from params', async () => {
    const ctx = mockContext('some-sub', undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws if the caller has no membership in the tenant', async () => {
    usersService.findByExternalAuthId.mockResolvedValue({ id: 'user-1' });
    repository.findMembershipByTenantAndUser.mockResolvedValue(undefined);

    const ctx = mockContext('some-sub', 'tenant-1');
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws if the caller is a revoked member', async () => {
    usersService.findByExternalAuthId.mockResolvedValue({ id: 'user-1' });
    repository.findMembershipByTenantAndUser.mockResolvedValue({
      role: 'owner',
      status: 'revoked',
    });

    const ctx = mockContext('some-sub', 'tenant-1');
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws if the caller is an active limited_member (not owner)', async () => {
    usersService.findByExternalAuthId.mockResolvedValue({ id: 'user-1' });
    repository.findMembershipByTenantAndUser.mockResolvedValue({
      role: 'limited_member',
      status: 'active',
    });

    const ctx = mockContext('some-sub', 'tenant-1');
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('allows an active owner through', async () => {
    usersService.findByExternalAuthId.mockResolvedValue({ id: 'user-1' });
    repository.findMembershipByTenantAndUser.mockResolvedValue({
      role: 'owner',
      status: 'active',
    });

    const ctx = mockContext('some-sub', 'tenant-1');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
