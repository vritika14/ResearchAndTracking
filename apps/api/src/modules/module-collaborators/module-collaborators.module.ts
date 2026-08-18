// apps/api/src/modules/module-collaborators/module-collaborators.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { ProjectModulesModule } from '../project-modules/project-modules.module';
import { ModuleCollaboratorsController } from './controllers/module-collaborators.controller';
import { ModuleCollaboratorsRepository } from './repositories/module-collaborators.repository';
import { ModuleCollaboratorsService } from './services/module-collaborators.service';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [EnumModule, forwardRef(() => ProjectModulesModule),MembershipsModule],
  controllers: [ModuleCollaboratorsController],
  providers: [ModuleCollaboratorsService, ModuleCollaboratorsRepository],
  exports: [ModuleCollaboratorsRepository],
})
export class ModuleCollaboratorsModule {}
