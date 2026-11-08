import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Server is healthy' })
  getHealth() {
    return this.healthService.getBasicHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (includes DB/Redis check)' })
  @ApiResponse({ status: 200, description: 'Server is ready' })
  @ApiResponse({ status: 503, description: 'Server is not ready' })
  async getReadiness() {
    return this.healthService.getReadinessCheck();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Server is alive' })
  getLiveness() {
    return this.healthService.getLivenessCheck();
  }
}