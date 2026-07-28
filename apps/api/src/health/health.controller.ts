import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get('live')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([]);
  }
}
