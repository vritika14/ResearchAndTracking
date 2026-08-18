// apps/api/src/modules/note-members/note-members.module.ts
import { Module } from '@nestjs/common';
import { NoteMembersController } from './controllers/note-members.controller';
import { NoteMembersRepository } from './repositories/note-members.repository';
import { NoteMembersService } from './services/note-members.service';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  controllers: [NoteMembersController],
  providers: [NoteMembersService, NoteMembersRepository],
  exports: [NoteMembersRepository],
  imports: [MembershipsModule],
})
export class NoteMembersModule {}
