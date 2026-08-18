// apps/api/src/modules/note-members/note-members.module.ts
import { Module } from '@nestjs/common';
import { NoteMembersController } from './controllers/note-members.controller';
import { NoteMembersRepository } from './repositories/note-members.repository';
import { NoteMembersService } from './services/note-members.service';

@Module({
  controllers: [NoteMembersController],
  providers: [NoteMembersService, NoteMembersRepository],
  exports: [NoteMembersRepository],
})
export class NoteMembersModule {}
