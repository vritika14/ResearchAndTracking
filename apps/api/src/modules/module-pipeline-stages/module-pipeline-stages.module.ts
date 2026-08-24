// apps/api/src/modules/module-pipeline-stages/module-pipeline-stages.module.ts
import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ModuleCollaboratorsModule } from '../module-collaborators/module-collaborators.module';
import { UsersModule } from '../users/users.module';
import { ModulePipelineStagesController } from './controllers/module-pipeline-stages.controller';
import { ModulePipelineStagesService } from './services/module-pipeline-stage.service';

@Module({
  imports: [EnumModule, MembershipsModule, UsersModule, ModuleCollaboratorsModule],
  controllers: [ModulePipelineStagesController],
  providers: [ModulePipelineStagesService],
})
export class ModulePipelineStagesModule {}
