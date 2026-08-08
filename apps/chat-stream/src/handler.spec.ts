import { PassThrough } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { handleChatStream } from './handler.js';

function collectLines(stream: PassThrough): string[] {
  const chunks: string[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk.toString('utf8')));
  return chunks;
}

describe('handleChatStream', () => {
  it('streams a VALIDATION_FAILED error event for a malformed request', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const stream = new PassThrough();
    const chunks = collectLines(stream);

    await handleChatStream({ body: JSON.stringify({}) }, stream);

    const events = chunks
      .join('')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as unknown);
    expect(events).toEqual([
      {
        type: 'error',
        code: 'VALIDATION_FAILED',
        message: 'workspaceId is required.',
        retryable: false,
      },
    ]);
  });

  it('streams start, zero-evidence retrieval, and insufficient_evidence done for a valid request', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const stream = new PassThrough();
    const chunks = collectLines(stream);

    await handleChatStream(
      {
        body: JSON.stringify({
          workspaceId: 'ws-1',
          conversationId: 'conv-1',
          question: 'How does rollback work?',
          clientRequestId: 'req-1',
          expectedConversationVersion: 1,
        }),
      },
      stream,
    );

    const events = chunks
      .join('')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as { type: string });
    expect(events.map((event) => event.type)).toEqual(['start', 'retrieval', 'done']);
    expect(events[2]).toMatchObject({ finishReason: 'insufficient_evidence' });
  });
});
