import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private configService: ConfigService) {}

  getBasicHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('nodeEnv'),
      version: process.env.npm_package_version || '0.0.1',
    };
  }

  async getReadinessCheck() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {},
    };

    try {
      // TODO: Add actual database and Redis health checks when services are implemented
      // For now, basic configuration check
      checks.checks['config'] = {
        status: 'ok',
        message: 'Configuration loaded',
      };

      const databaseUrl = this.configService.get('database.url');
      checks.checks['database_config'] = {
        status: databaseUrl ? 'ok' : 'error',
        message: databaseUrl ? 'Database URL configured' : 'Database URL missing',
      };

      const redisUrl = this.configService.get('redis.url');
      checks.checks['redis_config'] = {
        status: redisUrl ? 'ok' : 'warn',
        message: redisUrl ? 'Redis URL configured' : 'Redis URL not configured',
      };

      // If critical checks fail, return 503
      const hasErrors = Object.values(checks.checks).some(
        (check: any) => check.status === 'error',
      );

      if (hasErrors) {
        throw new ServiceUnavailableException('Health check failed');
      }

      return checks;
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: checks.checks,
      });
    }
  }

  getLivenessCheck() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}