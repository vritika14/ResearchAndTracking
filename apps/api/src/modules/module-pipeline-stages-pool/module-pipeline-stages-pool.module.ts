// apps/api/src/modules/module-pipeline-stages-pool/module-pipeline-stages-pool.module.ts
import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';
import { ModulePipelineStagesPoolController } from './controllers/module-pipeline-stages-pool.controller';
import { ModulePipelineStagesPoolService } from './services/module-pipeline-stages-pool.service';

@Module({
  imports: [EnumModule, MembershipsModule, UsersModule],
  controllers: [ModulePipelineStagesPoolController],
  providers: [ModulePipelineStagesPoolService],
})
export class ModulePipelineStagesPoolModule {}
