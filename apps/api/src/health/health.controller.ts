import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface HealthResponse {
  status: 'ok';
}

const REQUIRED_CONFIG_KEYS = [
  'APP_TABLE_NAME',
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
] as const;

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  // Reports that the process is running. Must not call any downstream service — see
  // docs/architecture.md §NestJS control-plane API.
  @Get('live')
  live(): HealthResponse {
    return { status: 'ok' };
  }

  // Verifies essential configuration is present — a lightweight check, not an expensive
  // downstream dependency fan-out (§5.6).
  @Get('ready')
  ready(): HealthResponse {
    const missing = REQUIRED_CONFIG_KEYS.filter((key) => !this.config.get<string>(key));
    if (missing.length > 0) {
      throw new ServiceUnavailableException(
        `Missing required configuration: ${missing.join(', ')}`,
      );
    }
    return { status: 'ok' };
  }
}
