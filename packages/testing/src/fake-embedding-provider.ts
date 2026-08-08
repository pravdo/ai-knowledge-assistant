import type { EmbeddingProvider } from '@ai-knowledge-assistant/model-providers';

// Deterministic, dependency-free embedding: same text always yields the same vector, and
// different text yields a different one. No network calls — useful for local UI work and unit
// tests that need a plausible embedding shape without a real provider (§13.5).
export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly provider = 'FAKE';
  readonly modelId = 'fake-embedding-v1';

  constructor(readonly dimension = 8) {}

  embed(texts: readonly string[]): Promise<readonly number[][]> {
    return Promise.resolve(texts.map((text) => this.embedOne(text)));
  }

  private embedOne(text: string): number[] {
    const vector = new Array<number>(this.dimension).fill(0);
    for (let index = 0; index < text.length; index += 1) {
      const slot = index % this.dimension;
      vector[slot] = (vector[slot] ?? 0) + text.charCodeAt(index);
    }
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / magnitude);
  }
}
