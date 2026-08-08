import { describe, expect, it } from 'vitest';

import { MAX_QUESTION_CHARACTERS, validateChatRequest } from './validate-chat-request.js';

const validBody = {
  workspaceId: 'ws-1',
  conversationId: 'conv-1',
  question: 'How does rollback work?',
  clientRequestId: 'req-1',
  expectedConversationVersion: 4,
};

describe('validateChatRequest', () => {
  it('accepts a well-formed request', () => {
    const result = validateChatRequest(validBody);
    expect(result).toEqual({ ok: true, value: validBody });
  });

  it('rejects a missing question', () => {
    const { question: _question, ...rest } = validBody;
    const result = validateChatRequest(rest);
    expect(result).toEqual({ ok: false, message: 'question is required.' });
  });

  it('rejects a question over the character limit', () => {
    const result = validateChatRequest({
      ...validBody,
      question: 'a'.repeat(MAX_QUESTION_CHARACTERS + 1),
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-object body', () => {
    expect(validateChatRequest(null)).toEqual({
      ok: false,
      message: 'Request body must be a JSON object.',
    });
    expect(validateChatRequest('not json').ok).toBe(false);
  });

  it('rejects a non-numeric expectedConversationVersion', () => {
    const result = validateChatRequest({ ...validBody, expectedConversationVersion: '4' });
    expect(result).toEqual({
      ok: false,
      message: 'expectedConversationVersion must be a number.',
    });
  });
});
