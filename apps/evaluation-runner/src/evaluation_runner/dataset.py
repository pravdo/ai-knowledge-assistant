"""Evaluation dataset model and validation (docs/architecture.md §11.2, §11.3).

Loading and validating the dataset is the evaluation runner's first responsibility (§11.10). The
remaining responsibilities (snapshotting the active configuration, running cases, scoring, and
reporting) depend on the RAG pipeline and are not wired yet.
"""

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

_REQUIRED_STRING_FIELDS = ("id", "question", "referenceAnswer", "category")
_REQUIRED_LIST_FIELDS = (
    "expectedDocumentIds",
    "expectedSections",
    "requiredFacts",
    "forbiddenClaims",
)


@dataclass(frozen=True, slots=True)
class EvaluationCase:
    id: str
    question: str
    reference_answer: str
    expected_document_ids: list[str]
    expected_sections: list[str]
    required_facts: list[str]
    forbidden_claims: list[str]
    unanswerable: bool
    category: str
    tags: list[str] = field(default_factory=list)


class DatasetValidationError(Exception):
    """Raised when a dataset file does not match the required case shape (§11.2)."""


def _parse_case(raw: dict[str, Any], index: int) -> EvaluationCase:
    for field_name in _REQUIRED_STRING_FIELDS:
        value = raw.get(field_name)
        if not isinstance(value, str) or not value.strip():
            raise DatasetValidationError(
                f"case[{index}]: '{field_name}' must be a non-empty string."
            )

    for field_name in _REQUIRED_LIST_FIELDS:
        if not isinstance(raw.get(field_name), list):
            raise DatasetValidationError(f"case[{index}]: '{field_name}' must be a list.")

    if not isinstance(raw.get("unanswerable"), bool):
        raise DatasetValidationError(f"case[{index}]: 'unanswerable' must be a boolean.")

    tags = raw.get("tags", [])
    if not isinstance(tags, list):
        raise DatasetValidationError(f"case[{index}]: 'tags' must be a list.")

    return EvaluationCase(
        id=raw["id"],
        question=raw["question"],
        reference_answer=raw["referenceAnswer"],
        expected_document_ids=list(raw["expectedDocumentIds"]),
        expected_sections=list(raw["expectedSections"]),
        required_facts=list(raw["requiredFacts"]),
        forbidden_claims=list(raw["forbiddenClaims"]),
        unanswerable=raw["unanswerable"],
        category=raw["category"],
        tags=list(tags),
    )


def load_dataset(path: Path) -> list[EvaluationCase]:
    """Load and validate a JSON dataset file, enforcing unique case IDs."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise DatasetValidationError("Dataset file must contain a JSON array of cases.")

    cases = [_parse_case(case, index) for index, case in enumerate(raw)]

    seen_ids: set[str] = set()
    for case in cases:
        if case.id in seen_ids:
            raise DatasetValidationError(f"Duplicate case id: {case.id!r}.")
        seen_ids.add(case.id)

    return cases


@dataclass(frozen=True, slots=True)
class DatasetSummary:
    case_count: int
    unanswerable_count: int

    @property
    def unanswerable_ratio(self) -> float:
        return self.unanswerable_count / self.case_count if self.case_count else 0.0


def summarize_dataset(cases: list[EvaluationCase]) -> DatasetSummary:
    unanswerable_count = sum(1 for case in cases if case.unanswerable)
    return DatasetSummary(case_count=len(cases), unanswerable_count=unanswerable_count)
