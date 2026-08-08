import { Controller, Get } from '@nestjs/common';

interface LivenessResponse {
  status: 'ok';
}

@Controller('health')
export class HealthController {
  // Reports that the process is running. Must not call any downstream service — see
  // docs/architecture.md §NestJS control-plane API.
  @Get('live')
  live(): LivenessResponse {
    return { status: 'ok' };
  }
}
