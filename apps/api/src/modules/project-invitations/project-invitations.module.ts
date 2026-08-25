// apps/api/src/modules/project-invitations/project-invitations.module.ts
import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ModuleInvitationsModule } from '../module-invitations/module-invitations.module';
import { ProjectCollaboratorsModule } from '../project-collaborators/project-collaborators.module';
import { ProjectsModule } from '../projects/project.module';
import { UsersModule } from '../users/users.module';
import { InvitationAcceptanceController } from './controllers/invitation-acceptance.controller';
import { ProjectInvitationsController } from './controllers/project-invitations.controller';
import { ProjectInvitationsRepository } from './repositories/project-invitations.repository';
import { ProjectInvitationsService } from './services/project-invitations.service';
import { MyInvitationsController } from './controllers/my-invitations.controller';
import { InvitationEmailModule } from '../invitation-email/invitation-email.module';

@Module({
  imports: [
    EnumModule,
    MembershipsModule,
    UsersModule,
    ProjectsModule,
    ProjectCollaboratorsModule,
    ModuleInvitationsModule,
    InvitationEmailModule,
  ],
  controllers: [
    ProjectInvitationsController,
    InvitationAcceptanceController,
    MyInvitationsController,
  ],
  providers: [ProjectInvitationsService, ProjectInvitationsRepository],
  exports: [ProjectInvitationsService],
})
export class ProjectInvitationsModule {}
