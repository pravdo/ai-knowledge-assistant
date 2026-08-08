# Evaluation datasets

Versioned, source-controlled sets of evaluation cases (docs/evaluation-strategy.md §Dataset
structure). Each file is a JSON array of cases; see
`apps/evaluation-runner/src/evaluation_runner/dataset.py` for the authoritative schema.

- `example.json` — a small (4-case) illustrative dataset covering a direct-factual question, a
  two-document question, an unanswerable question, and a user prompt-injection attempt. Useful for
  exercising the runner CLI (`evaluation-runner validate`), not a substitute for the real dataset.

The real dataset (30-50+ cases, ~15-20% intentionally unanswerable, covering every category listed
in docs/evaluation-strategy.md) is built in Week 13 once the RAG pipeline exists to evaluate.

Only public or synthetic content belongs here — this directory is committed to source control.
