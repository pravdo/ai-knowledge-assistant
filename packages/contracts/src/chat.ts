import type { Citation } from './citation.js';
import type { StableErrorCode } from './error.js';

// The client never submits provider, model, vector index, or workspace filter — those come from
// the active server-side configuration and authenticated resource context (§8.2).
export interface ChatRequest {
  workspaceId: string;
  conversationId: string;
  question: string;
  clientRequestId: string;
  expectedConversationVersion: number;
}

// Newline-delimited JSON events streamed to the browser (§8.1, §Appendix A). One JSON object per
// line; parsers must buffer partial network chunks until a complete line is available.
export type ChatStreamEvent =
  | { type: 'start'; messageId: string; conversationId: string }
  | { type: 'retrieval'; sourceCount: number }
  | { type: 'delta'; text: string }
  | { type: 'sources'; sources: Citation[] }
  | { type: 'usage'; inputTokens: number; outputTokens: number; modelId: string }
  | { type: 'done'; finishReason: 'end_turn' | 'insufficient_evidence' | 'cancelled' }
  | { type: 'error'; code: StableErrorCode; message: string; retryable: boolean };
