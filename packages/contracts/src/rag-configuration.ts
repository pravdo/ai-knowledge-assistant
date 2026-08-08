export type ModelProviderName = 'BEDROCK' | 'NVIDIA';

export type RagConfigurationStatus = 'CANDIDATE' | 'ACTIVE' | 'RETIRED';

// A versioned RAG configuration (Appendix A.1). Configuration is versioned application data, not
// mutable environment variables — a RAG change should not require a code deployment.
export interface RagConfiguration {
  workspaceId: string;
  version: number;
  status: RagConfigurationStatus;
  embedding: {
    provider: ModelProviderName;
    modelId: string;
    dimension: number;
    vectorIndex: string;
  };
  retrieval: {
    topK: number;
    metadataFilterVersion: string;
    deduplicate: boolean;
    adjacentChunkExpansion: number;
  };
  reranking: {
    enabled: boolean;
    provider: ModelProviderName;
    modelId: string;
    topN: number;
  };
  generation: {
    provider: ModelProviderName;
    modelId: string;
    temperature: number;
    maxOutputTokens: number;
  };
  promptVersion: string;
  guardrailVersion: string;
  createdBy: string;
  createdAt: string;
}
