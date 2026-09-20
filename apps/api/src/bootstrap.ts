import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';

// Shared by main.ts (local dev, Express listening on a port) and lambda.ts (API Gateway via
// serverless-express) so the two never drift apart.
export async function createApp(): Promise<NestExpressApplication> {
  // Nest's default logger prints coloured, multi-line startup text (one line per route) into
  // CloudWatch on every cold start; keep only its errors and warnings and log through the
  // structured logger instead.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });
  const allowedOrigins = (process.env['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins, allowedHeaders: ['authorization', 'content-type'] });
  app.setGlobalPrefix('v1', { exclude: ['health/live', 'health/ready'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
  return app;
}
