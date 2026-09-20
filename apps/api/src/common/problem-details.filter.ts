import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { ProblemDetails, StableErrorCode } from '@ai-knowledge-assistant/contracts';
import { RETRYABLE_ERROR_CODES } from '@ai-knowledge-assistant/contracts';
import { createLogger } from '@ai-knowledge-assistant/observability';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';

import { ProblemDetailsException } from './problem-details.exception.js';

// Exceptions Nest raises itself (validation pipe, the router's 404, the readiness probe's 503)
// carry a status but no stable code. Map the status to the closest one — labelling all of them
// VALIDATION_FAILED misreports a 404 as a bad request to clients and to log-based alerting.
const CODE_BY_STATUS: Readonly<Record<number, StableErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_FAILED',
  [HttpStatus.UNAUTHORIZED]: 'AUTHENTICATION_REQUIRED',
  [HttpStatus.FORBIDDEN]: 'WORKSPACE_ACCESS_DENIED',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

function toTitle(code: StableErrorCode): string {
  const words = code.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const logger = createLogger({
  service: 'api',
  environment: process.env['ENVIRONMENT'] ?? 'dev',
  applicationVersion: process.env['APPLICATION_VERSION'] ?? '0.0.0',
});

// §5.3: one stable, problem-details-style shape for every response. Never exposes stack traces,
// DynamoDB key internals, provider credentials, or full provider responses (§5.3, §9.6) — those
// go to structured logs only, keyed by requestId so they can be correlated after the fact.
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = randomUUID();

    if (exception instanceof ProblemDetailsException) {
      const status = exception.getStatus();
      this.respond(response, requestId, {
        type: exception.code,
        title: exception.message,
        status,
        detail: exception.message,
        requestId,
        retryable: RETRYABLE_ERROR_CODES.has(exception.code),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const rawMessage = typeof body === 'string' ? body : (body as { message?: unknown }).message;
      const detail = Array.isArray(rawMessage)
        ? rawMessage.map(String).join(' ')
        : typeof rawMessage === 'string'
          ? rawMessage
          : exception.message;
      const code = CODE_BY_STATUS[status] ?? 'INTERNAL_ERROR';
      this.respond(response, requestId, {
        type: code,
        title: toTitle(code),
        status,
        detail,
        requestId,
        retryable: RETRYABLE_ERROR_CODES.has(code),
      });
      return;
    }

    const description =
      exception instanceof Error ? `${exception.name}: ${exception.message}` : String(exception);
    logger.error(`unhandled exception: ${description}`, {
      requestId,
      errorCode: 'INTERNAL_ERROR',
    });
    this.respond(response, requestId, {
      type: 'INTERNAL_ERROR',
      title: 'Something went wrong',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred. Try again, and contact support if it persists.',
      requestId,
      retryable: false,
    });
  }

  private respond(response: Response, requestId: string, body: ProblemDetails): void {
    response.setHeader('x-request-id', requestId);
    response.status(body.status).json(body);
  }
}
