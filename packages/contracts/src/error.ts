// Stable error codes from docs/architecture.md Appendix A.3. The message shown to users must stay
// stable and safe; detailed diagnostics belong in restricted logs, never in the response body.
export const STABLE_ERROR_CODES = [
  'VALIDATION_FAILED',
  'AUTHENTICATION_REQUIRED',
  'WORKSPACE_ACCESS_DENIED',
  'ROLE_REQUIRED',
  'DOCUMENT_NOT_FOUND',
  'DOCUMENT_NOT_READY',
  'UPLOAD_EXPIRED',
  'UNSUPPORTED_FILE_TYPE',
  'FILE_TOO_LARGE',
  'DOCUMENT_PARSE_FAILED',
  'MODEL_THROTTLED',
  'MODEL_TIMEOUT',
  'VECTOR_CONFIGURATION_MISMATCH',
  'CONFLICT',
  'RATE_LIMITED',
] as const;

export type StableErrorCode = (typeof STABLE_ERROR_CODES)[number];

export const RETRYABLE_ERROR_CODES: ReadonlySet<StableErrorCode> = new Set([
  'DOCUMENT_NOT_READY',
  'UPLOAD_EXPIRED',
  'MODEL_THROTTLED',
  'MODEL_TIMEOUT',
  'RATE_LIMITED',
]);

// One stable, problem-details-style error shape for every API response (§5.3).
export interface ProblemDetails {
  type: StableErrorCode;
  title: string;
  status: number;
  detail: string;
  requestId: string;
  retryable: boolean;
}
