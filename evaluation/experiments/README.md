# Evaluation experiments

Records of evaluation runs, one variable changed at a time (docs/evaluation-strategy.md
§Experiment sequence and §Experiment record). Empty until the RAG pipeline and evaluation runner
`run` command exist (roadmap Week 13).

Recommended experiment order once started:

1. Establish a fixed baseline.
2. Improve document extraction quality.
3. Compare chunk size and boundaries.
4. Tune top-k and evidence budget.
5. Add reranking.
6. Compare embedding providers.
7. Compare generation providers.
8. Tune prompt and abstention policy.
9. Add conversation rewrite and summary.
10. Compare custom RAG with managed Bedrock Knowledge Bases.

Each run's record must capture the full configuration snapshot listed in
docs/evaluation-strategy.md §Experiment record — without it, a result cannot be reproduced.
