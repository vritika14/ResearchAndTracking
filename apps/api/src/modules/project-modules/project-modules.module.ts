// apps/api/src/modules/project-modules/project-modules.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { ModuleCollaboratorsModule } from '../module-collaborators/module-collaborators.module';
import { TenantSequencesModule } from '../tenant-sequences/tenant-sequences.module';
import { UsersModule } from '../users/users.module';
import { ProjectModulesController } from './controllers/project-modules.controller';
import { ProjectModulesRepository } from './repositories/project-modules.repository';
import { ProjectModulesService } from './services/project-modules.service';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    UsersModule,
    EnumModule,
    forwardRef(() => ModuleCollaboratorsModule),
    TenantSequencesModule,
    MembershipsModule,
  ],
  controllers: [ProjectModulesController],
  providers: [ProjectModulesService, ProjectModulesRepository],
  exports: [ProjectModulesRepository],
})
export class ProjectModulesModule {}
