# Operations runbook

## Reliability principles

**Idempotent by default.** Any operation triggered by an event, retry, browser re-submit, or
operator redrive must tolerate repetition. Amazon S3 and SQS both deliver at-least-once — use
deterministic IDs, conditional writes, and idempotency records rather than assuming exactly-once
delivery.

**Classify errors** into: validation/policy errors (do not retry), conflict errors (reconcile or
return 409), transient dependency errors (bounded retry with backoff and jitter), capacity/throttling
errors (retry and alert if sustained), and unknown errors (limited retry, then DLQ/failed state).

**Bound every dependency.** Set an explicit connection timeout, read timeout, overall operation
timeout, retry count, concurrency, batch size, token count, and file size for every external call.
An unbounded dependency is an availability and cost risk.

## Lambda practices

Initialize SDK and HTTP clients outside the handler and reuse them across invocations —
`packages/aws-clients` provides memoized singleton getters for exactly this reason. Keep
initialization deterministic; use environment variables for resource names, not secrets; tune
memory based on load tests; reserve concurrency for expensive ingestion/evaluation functions; avoid
storing user-sensitive state in the reused execution environment; use aliases and versions for
production deployment.

## SQS practices

Configure a DLQ on every queue; choose `maxReceiveCount` based on retry duration and operator
response time; set visibility timeout comfortably longer than expected function duration; use
partial batch responses (the ingestion worker's `batchItemFailures` pattern, already implemented in
`apps/ingestion/src/ingestion/handler.py`, is the reference for this); make every worker idempotent;
alarm on oldest-message age and DLQ depth; use a smaller batch size for large-document jobs to limit
blast radius.

## Document state machine

Allowed transitions (`packages/domain/src/document-state.ts`, unit tested):

```
CREATED -> UPLOADING -> UPLOADED -> QUEUED -> PROCESSING -> READY
PROCESSING -> FAILED
READY -> REPROCESSING -> READY | FAILED
READY | FAILED -> DELETING -> DELETED
```

Every update must include an expected current state (conditional write). A duplicate event must
never move a `READY` document back to `PROCESSING`.

## Structured logs

Consistent field names across the TypeScript (`packages/observability`) and Python
(`apps/ingestion`, `apps/evaluation-runner`) services, so cross-service queries work:

```
service, environment, applicationVersion, requestId, correlationId, causationId, userId,
workspaceId, documentId, documentVersion, jobId, conversationId, messageId, evaluationId,
provider, modelId, promptVersion, ragConfigurationVersion, coldStart, durationMs, status,
errorCode, retryCount
```

Never include raw request/response content in this shape — see
[threat-model.md](./threat-model.md)'s logging and privacy section.

## Metrics

- **API:** request count, 4xx/5xx count, latency percentiles, authorization failures, throttled
  requests, idempotency replay count, conflict count.
- **Ingestion:** documents queued/processing/ready/failed, processing duration, parser duration,
  chunks per document, embedding calls/batches, vector upsert duration, retry count, DLQ messages,
  oldest queue message age.
- **RAG:** candidate/final evidence count, reranking duration, time to first token, total generation
  duration, input/output tokens, citation count, insufficient-context rate, guardrail intervention
  count, positive/negative feedback rate, provider errors and throttling.
- **Cost:** model calls and tokens by provider/model, embedding volume, pages/bytes processed,
  evaluation cases executed, estimated cost per conversation and per evaluation run.

## Dashboards

Three focused dashboards, built in Week 12:

1. **Service health** — API request rate/errors, chat latency and provider failures, Lambda
   errors/throttles/duration/concurrency, DynamoDB errors and throttling.
2. **Ingestion** — queue depth and oldest age, processing throughput, failure codes, DLQ depth,
   average chunks and duration by file type.
3. **AI quality and cost** — feedback trend, abstention rate, evaluation quality trend, token use,
   time to first token, guardrail interventions.

## Alarms

At minimum: DLQ contains a message; API 5xx rate exceeds threshold; chat provider failure rate
exceeds threshold; ingestion failure rate exceeds threshold; queue oldest message age is too high;
Lambda throttling occurs; DynamoDB throttling occurs; chat p95 time to first token exceeds target;
monthly budget threshold reached; evaluation regression gate fails on the main branch. Every alarm
must link to a runbook below — an alarm without an expected action is noise.

## Runbooks

Each follows [runbook-template.md](./runbook-template.md). Seven are required; none has real
content yet since none of the underlying systems (Cognito, DynamoDB, SQS, Bedrock, evaluation
gates) are deployed:

1. **Ingestion backlog** — inspect queue age, concurrency, throttling, and parser duration.
2. **DLQ message** — inspect failure code, correct the underlying configuration, redrive safely.
3. **Chat provider failure** — verify provider health, credentials, region, quota, and fallback
   policy.
4. **Cross-workspace security concern** — disable the affected endpoint/configuration, preserve
   logs, investigate, rotate credentials if needed.
5. **Cost spike** — identify the model, user, evaluation, or retry source; apply quotas or
   concurrency limits.
6. **Bad RAG release** — reactivate the previous configuration and vector index.
7. **Document deletion incomplete** — resume deletion from the recorded stage and reconcile vector
   keys.

## Operational acceptance criteria

- [ ] Every async job has a correlation ID and stable job ID.
- [ ] Critical failures are visible without reading individual log streams.
- [ ] All alarms link to a runbook.
- [ ] A failed RAG configuration can be rolled back without redeploying code.
- [ ] DLQ redrive is tested.
- [ ] Metrics do not require raw document or prompt content.
- [ ] Cost and token usage can be attributed by environment and provider.

## Common mistakes to avoid

- Building only a polished chat interface.
- Letting the model choose authorization filters.
- Trusting client-provided S3 keys or MIME types.
- Assuming events arrive exactly once.
- Mixing embedding models in one vector index.
- Treating a retrieval/rerank score as answer confidence.
- Returning citations that were not supplied as evidence.
- Logging full prompts and documents by default.
- Deleting the source document but leaving its vectors behind.
- Reprocessing a document in place without rollback.
- Changing several RAG variables in one experiment.
- Running the expensive evaluation dataset on every small commit.
- Self-hosting GPU infrastructure before the product works end to end.
- Using a framework to hide every RAG decision.
- Shipping a model or prompt change without regression evaluation.
