import { createLogger } from '@ai-knowledge-assistant/observability';

export const logger = createLogger({
  service: 'api',
  environment: process.env['ENVIRONMENT'] ?? 'dev',
  applicationVersion: process.env['APPLICATION_VERSION'] ?? '0.0.0',
});
