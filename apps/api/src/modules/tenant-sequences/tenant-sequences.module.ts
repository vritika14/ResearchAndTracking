// apps/api/src/modules/tenant-sequences/tenant-sequences.module.ts
import { Module } from '@nestjs/common';
import { TenantSequencesRepository } from './repositories/tenant-sequences.repository';

@Module({
  providers: [TenantSequencesRepository],
  exports: [TenantSequencesRepository],
})
export class TenantSequencesModule {}
