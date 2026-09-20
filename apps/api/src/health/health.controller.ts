import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { logger } from '../observability/logger.js';

interface HealthResponse {
  status: 'ok' | 'unavailable';
}

const REQUIRED_CONFIG_KEYS = [
  'APP_TABLE_NAME',
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
] as const;

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  // Reports that the process is running. Must not call any downstream service
  @Get('live')
  live(): HealthResponse {
    return { status: 'ok' };
  }

  // Verifies essential configuration is present
  @Get('ready')
  ready(@Res({ passthrough: true }) response: Response): HealthResponse {
    const missing = REQUIRED_CONFIG_KEYS.filter((key) => !this.config.get<string>(key));
    if (missing.length > 0) {
      logger.error(`not ready, missing configuration: ${missing.join(', ')}`);
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'unavailable' };
    }
    return { status: 'ok' };
  }
}
