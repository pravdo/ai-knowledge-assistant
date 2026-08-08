export interface GenerationMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface GenerationRequest {
  readonly modelId: string;
  readonly systemPrompt: string;
  readonly messages: readonly GenerationMessage[];
  readonly temperature: number;
  readonly maxOutputTokens: number;
  readonly signal?: AbortSignal;
}

// The provider's raw stream (Bedrock ConverseStream, NIM chat completions). This is distinct from
// contracts' ChatStreamEvent: the orchestration layer maps these into citation-validated,
// persistence-ready events sent to the browser — it never forwards provider events verbatim.
export type GenerationEvent =
  | { type: 'delta'; text: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'done'; finishReason: 'end_turn' | 'max_tokens' | 'stop_sequence' }
  | { type: 'error'; message: string; retryable: boolean };

// §8.4. Keep interfaces small and domain-oriented: adapters own provider-specific request/response
// types, retries, and error mapping.
export interface GenerationProvider {
  readonly provider: string;
  stream(request: GenerationRequest): AsyncIterable<GenerationEvent>;
}
