import { randomUUID } from 'node:crypto';

import { createLogger } from '@ai-knowledge-assistant/observability';

import { writeNdjsonEvent } from './ndjson.js';
import { validateChatRequest } from './validate-chat-request.js';

// The Lambda Node.js runtime injects this global when the function is configured for response
// streaming (via a Function URL or the streaming invoke mode) — it is not an npm package.
declare const awslambda: {
  streamifyResponse<TEvent>(
    handler: (event: TEvent, responseStream: NodeJS.WritableStream) => Promise<void>,
  ): (event: TEvent, responseStream: NodeJS.WritableStream) => Promise<void>;
};

interface StreamingRequestEvent {
  body: string | null;
}

const logger = createLogger({
  service: 'chat-stream',
  environment: process.env['ENVIRONMENT'] ?? 'dev',
  applicationVersion: process.env['APPLICATION_VERSION'] ?? '0.0.0',
});

function parseJsonBody(body: string | null): unknown {
  if (!body) {
    return undefined;
  }
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

export async function handleChatStream(
  event: StreamingRequestEvent,
  responseStream: NodeJS.WritableStream,
): Promise<void> {
  // Yields to the microtask queue so this behaves like a real handler rather than resolving
  // synchronously; retrieval and generation calls below will make this genuinely async.
  await Promise.resolve();

  const requestId = randomUUID();
  const validation = validateChatRequest(parseJsonBody(event.body));

  if (!validation.ok) {
    logger.info('rejected malformed chat request', { requestId, errorCode: 'VALIDATION_FAILED' });
    writeNdjsonEvent(responseStream, {
      type: 'error',
      code: 'VALIDATION_FAILED',
      message: validation.message,
      retryable: false,
    });
    responseStream.end();
    return;
  }

  const { conversationId, workspaceId } = validation.value;
  const messageId = randomUUID();

  // Retrieval and generation are not wired yet (see docs/architecture.md roadmap, "RAG runtime and
  // model integration"). With zero evidence gathered, the system's own abstention policy (§8.12)
  // is the honest response: report insufficient evidence rather than fabricate an answer.
  logger.info('streaming insufficient-evidence response (retrieval not yet implemented)', {
    requestId,
    workspaceId,
    conversationId,
    messageId,
  });
  writeNdjsonEvent(responseStream, { type: 'start', messageId, conversationId });
  writeNdjsonEvent(responseStream, { type: 'retrieval', sourceCount: 0 });
  writeNdjsonEvent(responseStream, { type: 'done', finishReason: 'insufficient_evidence' });
  responseStream.end();
}

// `awslambda` only exists inside the real Lambda runtime. Guard with `typeof` (never throws on an
// undeclared global) so this module still loads under Vitest/Node for direct unit testing of
// handleChatStream above.
export const handler =
  typeof awslambda !== 'undefined'
    ? awslambda.streamifyResponse(handleChatStream)
    : handleChatStream;
