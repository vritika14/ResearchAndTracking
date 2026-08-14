import { Module } from '@nestjs/common';
import { EnumController } from './controllers/enum.controller';
import { EnumRepository } from './repositories/enum.repository';
import { EnumService } from './services/enum.service';

@Module({
  controllers: [EnumController],
  providers: [EnumService, EnumRepository],
  exports: [EnumService, EnumRepository],
})
export class EnumModule {}
