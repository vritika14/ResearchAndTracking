import { Module } from '@nestjs/common';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';
import { FeedbackController } from './controllers/feedback.controller';
import { FeedbackRepository } from './repositories/feedback.repository';
import { FeedbackService } from './services/feedback.service';

@Module({
  imports: [UsersModule, MembershipsModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository],
  exports: [FeedbackService, FeedbackRepository],
})
export class FeedbackModule {}
