import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLogger } from './logger.js';

describe('createLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const options = { service: 'api', environment: 'dev', applicationVersion: '0.1.0' };

  it('emits one structured JSON line per call with the base fields', () => {
    createLogger(options).info('workspace created', { workspaceId: 'ws-1' });

    const logSpy = vi.mocked(console.log);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      level: 'info',
      message: 'workspace created',
      service: 'api',
      environment: 'dev',
      applicationVersion: '0.1.0',
      workspaceId: 'ws-1',
    });
    expect(typeof parsed['timestamp']).toBe('string');
  });

  it('merges child context into every subsequent call', () => {
    const requestScoped = createLogger(options).child({ requestId: 'req-1' });
    requestScoped.warn('slow dependency', { durationMs: 900 });

    const logSpy = vi.mocked(console.log);
    const parsed = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(parsed).toMatchObject({ requestId: 'req-1', durationMs: 900 });
  });
});
