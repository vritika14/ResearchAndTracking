import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { MembershipsRepository } from '../repositories/memberships.repository';

interface AuthenticatedRequest extends Request {
  user: { sub: string; username?: string };
  params: { tenantId?: string };
}

@Injectable()
export class TenantOwnerGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly repository: MembershipsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenantId = req.params.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context is required');
    }

    const user = await this.usersService.findByExternalAuthId(req.user.sub);

    const membership = await this.repository.findMembershipByTenantAndUser(
      tenantId,
      user.id,
    );

    if (
      !membership ||
      membership.status !== 'active' ||
      membership.role !== 'owner'
    ) {
      throw new ForbiddenException(
        'Only the tenant owner can perform this action',
      );
    }

    return true;
  }
}
