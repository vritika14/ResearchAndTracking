import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MembershipsController } from './controllers/memberships.controller';
import { MembershipsService } from './services/memberships.service';
import { MembershipsRepository } from './repositories/memberships.repository';
import { TenantOwnerGuard } from './policies/tenant-owner.guard';
import { TenantMemberGuard } from './policies/tenant-member.guard';

@Module({
  imports: [UsersModule],
  controllers: [MembershipsController],
  providers: [
    MembershipsService,
    MembershipsRepository,
    TenantOwnerGuard,
    TenantMemberGuard,
  ],
})
export class MembershipsModule {}
