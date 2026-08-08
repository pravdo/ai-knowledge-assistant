import { Module } from '@nestjs/common';

// Owns RAG configuration versions (embedding/retrieval/reranking/generation/prompt/guardrail).
// Configuration is versioned application data, not mutable environment variables.
@Module({})
export class RagConfigurationModule {}
