import type { DocumentStatus } from '@ai-knowledge-assistant/contracts';

// Allowed transitions from docs/architecture.md §Reliability §Document state machine. A duplicate
// event must never move a READY document back to PROCESSING — every caller must supply the
// expected current state and use a conditional write (§Idempotency and optimistic concurrency).
const ALLOWED_TRANSITIONS: Readonly<Record<DocumentStatus, ReadonlySet<DocumentStatus>>> = {
  CREATED: new Set(['UPLOADING']),
  UPLOADING: new Set(['UPLOADED']),
  UPLOADED: new Set(['QUEUED']),
  QUEUED: new Set(['PROCESSING']),
  PROCESSING: new Set(['READY', 'FAILED']),
  READY: new Set(['REPROCESSING', 'DELETING']),
  FAILED: new Set(['DELETING']),
  REPROCESSING: new Set(['READY', 'FAILED']),
  DELETING: new Set(['DELETED']),
  DELETED: new Set(),
};

export function canTransitionDocumentState(from: DocumentStatus, to: DocumentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].has(to);
}

export function isTerminalDocumentState(status: DocumentStatus): boolean {
  return ALLOWED_TRANSITIONS[status].size === 0;
}
