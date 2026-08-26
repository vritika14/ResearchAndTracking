// apps/api/src/modules/pipeline-stages/pipeline-stages.module.ts
import { Module } from '@nestjs/common';
import { EnumModule } from '../enum/enum.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';
import { PipelineStagesController } from './controllers/pipeline-stages.controller';
import { PipelineStagesService } from './services/pipeline-stages.service';

@Module({
  imports: [EnumModule, MembershipsModule, UsersModule],
  controllers: [PipelineStagesController],
  providers: [PipelineStagesService],
})
export class PipelineStagesModule {}
