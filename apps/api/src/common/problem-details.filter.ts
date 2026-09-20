import {
  BadRequestException,
  Catch,
  HttpStatus,
  NotFoundException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { ProblemDetails } from '@ai-knowledge-assistant/contracts';
import { RETRYABLE_ERROR_CODES } from '@ai-knowledge-assistant/contracts';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';

import { logger } from '../observability/logger.js';
import { ProblemDetailsException } from './problem-details.exception.js';

function toProblemDetailsException(exception: unknown): ProblemDetailsException | undefined {
  if (exception instanceof ProblemDetailsException) {
    return exception;
  }
  if (exception instanceof BadRequestException) {
    return new ProblemDetailsException('VALIDATION_FAILED', validationDetail(exception));
  }
  if (exception instanceof NotFoundException) {
    return new ProblemDetailsException('NOT_FOUND', exception.message);
  }
  return undefined;
}

function validationDetail(exception: BadRequestException): string {
  const body = exception.getResponse();
  const message = typeof body === 'string' ? body : (body as { message?: unknown }).message;
  if (Array.isArray(message)) {
    return message.map(String).join(' ');
  }
  return typeof message === 'string' ? message : exception.message;
}

// stable, problem-details-style shape for every response
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = randomUUID();

    const problem = toProblemDetailsException(exception);
    if (problem) {
      this.respond(response, requestId, {
        type: problem.code,
        title: problem.message,
        status: problem.getStatus(),
        detail: problem.message,
        requestId,
        retryable: RETRYABLE_ERROR_CODES.has(problem.code),
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
