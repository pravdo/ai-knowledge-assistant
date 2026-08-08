import { describe, expect, it } from 'vitest';

import { RETRYABLE_ERROR_CODES, STABLE_ERROR_CODES } from './error.js';

describe('error codes', () => {
  it('only marks known stable codes as retryable', () => {
    for (const code of RETRYABLE_ERROR_CODES) {
      expect(STABLE_ERROR_CODES).toContain(code);
    }
  });
});
