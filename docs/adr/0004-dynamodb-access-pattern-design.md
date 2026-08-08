# ADR-0004: DynamoDB access-pattern design

Status: Accepted
Date: 2026-08-09
Owners: praavdo

## Context

DynamoDB rewards designing from access patterns rather than a normalized entity diagram. The
system's required patterns are enumerated in [architecture.md](../architecture.md)'s operational
data model: list workspaces for a user, get membership, list members, list documents by
workspace/status, get a document's active processing version, list conversations, load messages in
order, get the current RAG configuration, list evaluation runs, find an idempotency result by key,
and more.

## Decision

One main application table for strongly related operational entities (workspace, membership,
document, processing version, chunk, conversation, message, feedback, RAG configuration,
evaluation), keyed so every listed access pattern is served by `GetItem`, `Query`, or `BatchGetItem`
— never a table scan. A separate, dedicated idempotency table stores request-hash/result/TTL
records, since its access pattern (single-key lookup with expiry) and lifecycle are unrelated to
the operational entities. A GSI (`USER#{userId}` → `WORKSPACE#{workspaceId}`) supports the
user-to-workspace listing pattern; no other GSI is created until a real access pattern needs it —
every index adds write cost and operational surface.

## Alternatives considered

- **Fully normalized relational schema (Aurora/RDS)** — natural joins, but no access pattern here
  needs a join across entities the application doesn't already own by ID; DynamoDB's single-digit-
  millisecond key access fits the read-heavy workspace/chat paths better at this scale and cost.
- **One table for everything, including idempotency records** — technically possible, but mixes a
  short-lived, high-churn TTL'd concern into the same partition-key space as long-lived operational
  data, complicating both.

## Consequences

- Every new feature must state its access pattern _before_ choosing keys — reflected in
  [architecture.md](../architecture.md)'s explicit requirement to draft access patterns ahead of
  data services (see the "Definition of Ready" checklist).
- Full document content and chunk text are never stored in a single DynamoDB item; large content
  lives in S3, referenced by key, keeping items well under DynamoDB's item-size limits.
- State transitions (document status, RAG configuration activation, membership changes) use
  conditional writes against an expected version, not blind overwrites — see
  [operations-runbook.md](../operations-runbook.md)'s reliability principles.

## Revisit triggers

- A genuinely relational access pattern emerges (ad hoc reporting joins, complex aggregations) that
  DynamoDB cannot serve without denormalizing into an unreasonable number of items/indexes.
