import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { InvitationsController } from './controllers/invitations.controller';
import { MembershipsController } from './controllers/memberships.controller';
import { TenantMemberGuard } from './policies/tenant-member.guard';
import { TenantOwnerGuard } from './policies/tenant-owner.guard';
import { MembershipsRepository } from './repositories/memberships.repository';
import { MembershipsService } from './services/memberships.service';

@Module({
  imports: [UsersModule],
  controllers: [MembershipsController, InvitationsController],
  providers: [
    MembershipsService,
    MembershipsRepository,
    TenantOwnerGuard,
    TenantMemberGuard,
  ],
  exports: [MembershipsService, MembershipsRepository],
})
export class MembershipsModule {}
