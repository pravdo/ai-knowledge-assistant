// §8.4. Provider adapters (Bedrock, NVIDIA NeMo Retriever) implement this; the orchestration layer
// depends only on this interface, never on a provider SDK directly.
export interface EmbeddingProvider {
  readonly provider: string;
  readonly modelId: string;
  readonly dimension: number;
  embed(texts: readonly string[]): Promise<readonly number[][]>;
}
