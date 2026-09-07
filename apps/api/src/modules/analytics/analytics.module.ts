import { Module } from '@nestjs/common';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [UsersModule, MembershipsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}
