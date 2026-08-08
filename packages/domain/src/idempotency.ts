import { createHash } from 'node:crypto';

// Deterministic hash of a request body for the Idempotency-Key pattern (§5.5): store the client's
// key alongside this hash, and if the same key arrives with a different hash, return a conflict
// rather than silently replaying or overwriting the original result.
export function hashRequestBody(body: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(sortKeysDeep(body)))
    .digest('hex');
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entryValue]) => [key, sortKeysDeep(entryValue)]),
    );
  }
  return value;
}
