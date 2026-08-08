import { describe, expect, it } from 'vitest';

import { canTransitionDocumentState, isTerminalDocumentState } from './document-state.js';

describe('canTransitionDocumentState', () => {
  it('allows the documented happy path', () => {
    expect(canTransitionDocumentState('CREATED', 'UPLOADING')).toBe(true);
    expect(canTransitionDocumentState('UPLOADING', 'UPLOADED')).toBe(true);
    expect(canTransitionDocumentState('UPLOADED', 'QUEUED')).toBe(true);
    expect(canTransitionDocumentState('QUEUED', 'PROCESSING')).toBe(true);
    expect(canTransitionDocumentState('PROCESSING', 'READY')).toBe(true);
  });

  it('allows reprocessing and deletion from READY', () => {
    expect(canTransitionDocumentState('READY', 'REPROCESSING')).toBe(true);
    expect(canTransitionDocumentState('REPROCESSING', 'READY')).toBe(true);
    expect(canTransitionDocumentState('READY', 'DELETING')).toBe(true);
  });

  it('rejects a duplicate event moving a READY document back to PROCESSING', () => {
    expect(canTransitionDocumentState('READY', 'PROCESSING')).toBe(false);
  });

  it('rejects any transition out of a terminal state', () => {
    expect(canTransitionDocumentState('DELETED', 'CREATED')).toBe(false);
    expect(isTerminalDocumentState('DELETED')).toBe(true);
  });

  it('treats FAILED as recoverable only through deletion', () => {
    expect(canTransitionDocumentState('FAILED', 'DELETING')).toBe(true);
    expect(canTransitionDocumentState('FAILED', 'PROCESSING')).toBe(false);
  });
});
