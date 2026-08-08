import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { writeNdjsonEvent } from './ndjson.js';

describe('writeNdjsonEvent', () => {
  it('writes exactly one JSON line per event', () => {
    const stream = new PassThrough();
    const chunks: string[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk.toString('utf8')));

    writeNdjsonEvent(stream, { type: 'start', messageId: 'msg-1', conversationId: 'conv-1' });
    writeNdjsonEvent(stream, { type: 'done', finishReason: 'end_turn' });

    const lines = chunks.join('').split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0] ?? '')).toEqual({
      type: 'start',
      messageId: 'msg-1',
      conversationId: 'conv-1',
    });
    expect(JSON.parse(lines[1] ?? '')).toEqual({ type: 'done', finishReason: 'end_turn' });
  });
});
