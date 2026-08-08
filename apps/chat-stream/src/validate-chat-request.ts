import type { ChatRequest } from '@ai-knowledge-assistant/contracts';

export const MAX_QUESTION_CHARACTERS = 4000;

export type ChatRequestValidation =
  { ok: true; value: ChatRequest } | { ok: false; message: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// Shape and size validation only (§7.3 "the browser validation exists for user experience; worker
// validation is the security control" applies equally here). Workspace membership, conversation
// ownership, and rate limits are enforced by the caller once authorization is wired in Week 8.
export function validateChatRequest(body: unknown): ChatRequestValidation {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Request body must be a JSON object.' };
  }

  const candidate = body as Record<string, unknown>;

  if (!isNonEmptyString(candidate['workspaceId'])) {
    return { ok: false, message: 'workspaceId is required.' };
  }
  if (!isNonEmptyString(candidate['conversationId'])) {
    return { ok: false, message: 'conversationId is required.' };
  }
  if (!isNonEmptyString(candidate['question'])) {
    return { ok: false, message: 'question is required.' };
  }
  if (candidate['question'].length > MAX_QUESTION_CHARACTERS) {
    return {
      ok: false,
      message: `question must be at most ${MAX_QUESTION_CHARACTERS} characters.`,
    };
  }
  if (!isNonEmptyString(candidate['clientRequestId'])) {
    return { ok: false, message: 'clientRequestId is required.' };
  }
  if (typeof candidate['expectedConversationVersion'] !== 'number') {
    return { ok: false, message: 'expectedConversationVersion must be a number.' };
  }

  return {
    ok: true,
    value: {
      workspaceId: candidate['workspaceId'],
      conversationId: candidate['conversationId'],
      question: candidate['question'],
      clientRequestId: candidate['clientRequestId'],
      expectedConversationVersion: candidate['expectedConversationVersion'],
    },
  };
}
