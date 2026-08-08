import type {
  GenerationEvent,
  GenerationProvider,
  GenerationRequest,
} from '@ai-knowledge-assistant/model-providers';

// Streams a fixed reply word by word, then a usage event and a done event. No network calls.
export class FakeGenerationProvider implements GenerationProvider {
  readonly provider = 'FAKE';

  constructor(private readonly reply = 'This is a fake generated answer.') {}

  async *stream(request: GenerationRequest): AsyncIterable<GenerationEvent> {
    // Yields to the microtask queue so this behaves like a real provider's initial round-trip
    // rather than resolving synchronously.
    await Promise.resolve();
    const words = this.reply.split(' ');
    for (const word of words) {
      if (request.signal?.aborted) {
        yield { type: 'done', finishReason: 'stop_sequence' };
        return;
      }
      yield { type: 'delta', text: `${word} ` };
    }
    yield { type: 'usage', inputTokens: request.messages.length * 10, outputTokens: words.length };
    yield { type: 'done', finishReason: 'end_turn' };
  }
}
