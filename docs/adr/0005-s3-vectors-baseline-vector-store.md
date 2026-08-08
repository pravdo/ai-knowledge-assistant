# ADR-0005: S3 Vectors as the baseline vector store

Status: Accepted
Date: 2026-08-09
Owners: praavdo

## Context

Retrieval needs a vector store that supports per-workspace metadata filtering (the mandatory
authorization boundary described in [threat-model.md](../threat-model.md)), without taking on a
search cluster to operate for a low/no-traffic portfolio project.

## Decision

Use Amazon S3 Vectors as the baseline vector store, behind the narrow `VectorStore` interface in
`packages/retrieval` (`upsert` / `query` / `delete`). It provides an AWS-native vector API with
metadata filtering and no search cluster to run, and integrates directly with Bedrock Knowledge
Bases for the managed-comparison path (ADR-0006). One vector index per distinct embedding
configuration (provider + model + dimension) — never mix embedding models or dimensions in a single
index.

## Alternatives considered

| Option                         | Strength                                                 | Trade-off                                                                 |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| S3 Vectors (chosen)            | Low operational overhead, AWS-native, metadata filtering | Newer service, fewer advanced search features                             |
| OpenSearch Serverless          | Vector _and_ lexical search, filtering, mature tooling   | More cost and operational concepts                                        |
| Aurora PostgreSQL + `pgvector` | SQL, relational joins, transactional data                | Database operations and scaling to manage                                 |
| Bedrock Knowledge Bases        | Managed ingestion and retrieval workflow                 | Less custom control; evaluated as ADR-0006's comparison, not the baseline |

## Consequences

- Blue/green index promotion is required for any embedding-model change: create the new index,
  reprocess documents into it, evaluate, activate a new RAG configuration referencing it, keep the
  old index for rollback, then remove it after the rollback window.
- Retrieval latency and hybrid (lexical + vector) search quality are bounded by what S3 Vectors
  currently offers; this is an explicit, accepted trade-off for the baseline, not an oversight.
- The interface boundary (`VectorStore`) is deliberately narrow so swapping the implementation is a
  contained change, not a rewrite of the chat orchestration.

## Revisit triggers

- Hybrid lexical-and-vector search becomes essential to answer quality.
- Measured retrieval latency does not meet the [evaluation-strategy.md](../evaluation-strategy.md)
  release gates and a different store measurably does.
- Rich filtering, aggregations, or search analytics are required beyond metadata filtering.
- A relational data-and-vector access pattern turns out to be simpler in PostgreSQL.
