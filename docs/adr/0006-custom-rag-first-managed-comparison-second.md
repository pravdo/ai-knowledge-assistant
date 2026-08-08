# ADR-0006: Custom RAG pipeline first, managed comparison second

Status: Accepted
Date: 2026-08-09
Owners: praavdo

## Context

Amazon Bedrock Knowledge Bases can fetch source data, generate embeddings, and manage vectors as a
managed RAG workflow, which would reduce the amount of custom pipeline code needed. But the
explicit goal of this project (see [architecture.md](../architecture.md)'s product statement) is to
demonstrate — and be able to explain in an interview — how authorization, chunking, retrieval,
citation validation, and evaluation actually work, not just that a managed service can answer
questions.

## Decision

Build and evaluate the custom pipeline first (parsing → chunking → embedding → S3 Vectors →
retrieval → reranking → generation → citation validation), fully owned in
`apps/ingestion` and `apps/chat-stream`. Only after that pipeline is stable and evaluated
(roadmap Week 15), build a second path using Bedrock Knowledge Bases with S3 Vectors, and run the
same evaluation dataset against both to produce a documented comparison (time to implement,
chunking flexibility, parser control, retrieval customization, evaluation integration, citation
behavior, reindexing/deletion, observability, cost, operational effort).

## Alternatives considered

- **Managed Knowledge Bases from the start** — faster to a working demo, but forfeits the
  chunking/retrieval/citation engineering work that is the actual point of the project, and gives
  nothing to meaningfully compare against later.
- **Never building the managed path** — simpler scope, but loses the chance to demonstrate
  understanding of the managed-vs-custom trade-off, which is valuable interview material in its own
  right.

## Consequences

- More implementation work upfront (the full custom pipeline) before any managed shortcut is
  available.
- The evaluation dataset and runner (`apps/evaluation-runner`) must be built before Week 15's
  comparison is possible — they are load-bearing for this decision, not optional polish.
- The comparison itself becomes a concrete, portfolio-worthy artifact: "here is measured evidence
  for when a custom RAG pipeline is worth building versus using a managed service."

## Revisit triggers

- If time runs out before Week 15, the managed-comparison path is the first thing cut per the
  scope-adjustment rules in the source blueprint's roadmap — the custom pipeline, evaluation, and
  security work are never cut.
