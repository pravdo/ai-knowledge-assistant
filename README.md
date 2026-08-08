# AI Knowledge Assistant

An authenticated engineering knowledge assistant: upload technical documents into a workspace,
they're processed asynchronously, and questions are answered with retrieval-augmented generation
grounded in that workspace's own content — every claim traceable to a cited, inspectable source
excerpt. When the corpus doesn't support an answer, the system says so explicitly instead of
inventing one.

Built with Angular, NestJS, Python, and AWS (Lambda, API Gateway, Cognito, DynamoDB, S3, S3
Vectors, EventBridge/SQS, Bedrock), with NVIDIA NIM/NeMo Retriever as a second, swappable model
provider. Full specification: see the
[source blueprint](./AI_Knowledge_Assistant_Complete_Project_Blueprint.pdf).

> **Status: Week 1 — foundation.** This repository currently contains the monorepo scaffold: every
> app and package builds, lints, and tests; all 7 CDK stacks synthesize; the health endpoint and a
> few genuinely-completable pieces (document state machine, RAG contracts, evaluation dataset
> validation, ingestion event normalization) have real, tested logic. Everything else — Cognito,
> the actual retrieval/generation pipeline, deployment — lands week by week per the roadmap in the
> source blueprint. There is no demo recording or cloud deployment yet.

## Architecture

See [docs/architecture.md](./docs/architecture.md) for the full logical architecture, component
responsibilities, trust boundaries, and repository layout. Key design decisions are recorded as
ADRs in [docs/adr/](./docs/adr/).

```
apps/
  web/                 Angular application (standalone, zoneless, signals)
  api/                 NestJS control-plane Lambda
  chat-stream/         Lightweight streaming Lambda (AWS Lambda response streaming, NDJSON)
  ingestion/           Python ingestion worker (uv)
  evaluation-runner/   Python evaluation CLI (uv, Typer)
packages/
  contracts/           Shared DTOs, error codes, streaming/event shapes
  domain/              State machines and pure business rules
  aws-clients/         Memoized AWS SDK client wrappers
  model-providers/     Bedrock/NVIDIA embedding + generation provider interfaces
  retrieval/           Vector store + reranker interfaces
  observability/       Structured logger shared across TS services
  testing/             Fake provider implementations for local dev and fast tests
infrastructure/        AWS CDK app — 7 stacks, empty until their week lands
evaluation/             datasets/, experiments/, reports/
docs/                   architecture, threat model, evaluation strategy, runbooks, ADRs
```

## Security and data policy

Authorization happens before retrieval; the model never chooses what a user can see. Only public or
synthetic content is ever ingested — see
[docs/adr/0009-public-synthetic-portfolio-corpus-policy.md](./docs/adr/0009-public-synthetic-portfolio-corpus-policy.md).
Full threat model: [docs/threat-model.md](./docs/threat-model.md).

## Local development

Prerequisites: [nvm](https://github.com/nvm-sh/nvm) (or Node 24+), [pnpm](https://pnpm.io) 11+
(`corepack enable`), and [uv](https://docs.astral.sh/uv/) for the Python apps.

```bash
# TypeScript workspace (apps/web, apps/api, apps/chat-stream, packages/*, infrastructure)
pnpm install
pnpm build      # packages/* must be built before apps that import them (workspace dependency order)
pnpm dev:web    # http://localhost:4200
pnpm dev:api    # http://localhost:3000

# Python apps (each is an independent uv project)
cd apps/ingestion && uv sync
cd apps/evaluation-runner && uv sync
```

No secrets are required for local development yet — nothing in this repository calls AWS or a
model provider without deployed infrastructure. `packages/testing`'s fake providers exist for
exactly this reason: implementing chat/retrieval features against `FakeEmbeddingProvider`,
`FakeGenerationProvider`, `FakeVectorStore`, and `FakeReranker` needs no network access or
credentials at all.

## Cloud deployment

Not yet available — Cognito, the data stack, and the API stack are built starting Week 2. Once
they exist:

```bash
pnpm cdk synth --context environment=dev    # already works today (empty stacks)
pnpm cdk deploy --context environment=dev   # requires AWS credentials; not yet meaningful
```

Each of `dev`/`stage`/`prod` gets its own Cognito resources, S3 buckets, DynamoDB tables, SQS
queues, vector indexes, API stage, and KMS keys — see
[docs/architecture.md](./docs/architecture.md#environment-topology).

## Configuration and secrets

Not yet applicable — see [docs/threat-model.md](./docs/threat-model.md#data-protection) for the
policy that will govern this once real configuration exists (AWS resource names and model IDs are
configuration; provider credentials and signing material are secrets, stored in Secrets Manager,
never in the repository or logs).

## Running tests

```bash
pnpm test                 # every TS app/package (Vitest for packages/chat-stream/web, Jest for api/infrastructure)
pnpm --filter @ai-knowledge-assistant/api run test:e2e

cd apps/ingestion && uv run pytest
cd apps/evaluation-runner && uv run pytest
```

```bash
pnpm lint        # ESLint (flat config, typed linting) across every TS app/package
pnpm typecheck   # tsc --noEmit everywhere

cd apps/ingestion && uv run ruff check . && uv run ruff format --check . && uv run mypy src
cd apps/evaluation-runner && uv run ruff check . && uv run ruff format --check . && uv run mypy src
```

## Running evaluation

The dataset loader and CLI are real today; running cases against a RAG configuration is not (there
is no pipeline yet to evaluate — roadmap Week 13):

```bash
cd apps/evaluation-runner
uv run evaluation-runner validate ../../evaluation/datasets/example.json
```

Full strategy, metrics, and release gates: [docs/evaluation-strategy.md](./docs/evaluation-strategy.md).

## Monitoring and operations

Not yet deployed. Structured log field names, metrics, dashboards, alarms, and the 7 required
incident runbooks are specified in
[docs/operations-runbook.md](./docs/operations-runbook.md), ready to be wired up starting Week 12.

## Cost controls

No cloud resources are deployed yet, so there is no running cost. The cost-control mechanisms this
project will use once deployed (AWS Budgets alerts, per-user/workspace quotas, reserved
concurrency, development-tier model allowlists, log retention limits) are listed in
[docs/threat-model.md](./docs/threat-model.md#abuse-and-cost-controls).

## Cleanup

Nothing is deployed yet. Once stacks exist, `pnpm cdk destroy --context environment=dev` tears down
a given environment; disposable dev resources use `RemovalPolicy.DESTROY`, retained resources
(documents, evaluation history) do not.

## Limitations

This is Week 1 of a 15-week roadmap. As of today: no authentication, no document upload, no
retrieval, no generation, nothing deployed to AWS. What _is_ real: the monorepo builds end to end;
the document state machine, workspace role hierarchy, RAG contracts, and streaming NDJSON protocol
are implemented and tested; the ingestion worker's event-normalization stage and the evaluation
dataset validator work against real (synthetic) data; all 7 CDK stacks synthesize valid, empty
CloudFormation templates.

## Certification learning map

| AWS Developer Associate domain   | Project evidence                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Development with AWS Services    | Lambda, API Gateway, DynamoDB, S3, SQS, EventBridge, SDKs, async patterns                         |
| Security                         | Cognito, JWT validation, IAM, KMS, Secrets Manager, presigned access, least privilege             |
| Deployment                       | CDK/CloudFormation, Lambda versions and aliases, CI/CD, canary release, environment configuration |
| Troubleshooting and Optimization | CloudWatch, X-Ray, Powertools, retries, DLQ, concurrency, token/latency metrics                   |

| NCA-GENL topic                  | Project evidence                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| Generative AI and LLM content   | Tokens, embeddings, prompts, context windows, model inference                        |
| Core ML and AI                  | Similarity, ranking, evaluation metrics, overfitting to an evaluation set            |
| Software development            | Python pipeline, TypeScript provider interfaces, APIs, deployment                    |
| Experimentation                 | Versioned datasets, controlled RAG experiments, baseline comparisons                 |
| Data analysis and visualization | Metric computation, reports, quality/latency dashboard                               |
| Trustworthy AI                  | Prompt injection, guardrails, privacy, abstention, groundedness, citation validation |
