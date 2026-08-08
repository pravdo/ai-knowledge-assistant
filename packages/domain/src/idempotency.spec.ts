import { describe, expect, it } from 'vitest';

import { hashRequestBody } from './idempotency.js';

describe('hashRequestBody', () => {
  it('is stable regardless of key order', () => {
    const a = hashRequestBody({ name: 'ws', description: 'x' });
    const b = hashRequestBody({ description: 'x', name: 'ws' });
    expect(a).toBe(b);
  });

  it('changes when the body changes', () => {
    const a = hashRequestBody({ name: 'ws' });
    const b = hashRequestBody({ name: 'other' });
    expect(a).not.toBe(b);
  });

  it('hashes nested structures consistently', () => {
    const a = hashRequestBody({ member: { role: 'OWNER', userId: '1' } });
    const b = hashRequestBody({ member: { userId: '1', role: 'OWNER' } });
    expect(a).toBe(b);
  });
});
