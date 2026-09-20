import { HttpException } from '@nestjs/common';
import type { StableErrorCode } from '@ai-knowledge-assistant/contracts';

// §5.3: "Use one stable problem-details-style error shape." Every status code a business rule
// can legitimately raise; ordering mirrors packages/contracts' STABLE_ERROR_CODES.
const STATUS_BY_CODE: Record<StableErrorCode, number> = {
  VALIDATION_FAILED: 400,
  AUTHENTICATION_REQUIRED: 401,
  WORKSPACE_ACCESS_DENIED: 403,
  ROLE_REQUIRED: 403,
  NOT_FOUND: 404,
  DOCUMENT_NOT_FOUND: 404,
  DOCUMENT_NOT_READY: 409,
  UPLOAD_EXPIRED: 410,
  UNSUPPORTED_FILE_TYPE: 415,
  FILE_TOO_LARGE: 413,
  DOCUMENT_PARSE_FAILED: 422,
  MODEL_THROTTLED: 429,
  MODEL_TIMEOUT: 504,
  VECTOR_CONFIGURATION_MISMATCH: 409,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

// Thrown from services/guards; ProblemDetailsFilter turns it into the stable response shape.
// Never exposes stack traces or internal details — `detail` is the only thing that reaches the
// client, so it must already be a safe, user-facing message.
export class ProblemDetailsException extends HttpException {
  constructor(
    readonly code: StableErrorCode,
    detail: string,
  ) {
    super(detail, STATUS_BY_CODE[code]);
  }
}
