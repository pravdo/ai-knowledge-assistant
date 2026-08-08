import json
from pathlib import Path

import pytest

from evaluation_runner.dataset import (
    DatasetValidationError,
    EvaluationCase,
    load_dataset,
    summarize_dataset,
)

VALID_CASE = {
    "id": "case-001",
    "question": "How is a failed deployment rolled back?",
    "referenceAnswer": "The deployment rolls back automatically when the configured alarm enters "
    "the ALARM state.",
    "expectedDocumentIds": ["deployment-guide"],
    "expectedSections": ["Rollback strategy"],
    "requiredFacts": ["rollback is automatic", "an alarm triggers rollback"],
    "forbiddenClaims": ["rollback requires a manual database command"],
    "unanswerable": False,
    "category": "single-hop",
    "tags": ["deployment", "operations"],
}


def _write(tmp_path: Path, cases: list[dict[str, object]]) -> Path:
    dataset_path = tmp_path / "dataset.json"
    dataset_path.write_text(json.dumps(cases), encoding="utf-8")
    return dataset_path


def test_loads_a_well_formed_dataset(tmp_path: Path) -> None:
    path = _write(tmp_path, [VALID_CASE])

    cases = load_dataset(path)

    assert cases == [
        EvaluationCase(
            id="case-001",
            question=VALID_CASE["question"],
            reference_answer=VALID_CASE["referenceAnswer"],
            expected_document_ids=["deployment-guide"],
            expected_sections=["Rollback strategy"],
            required_facts=["rollback is automatic", "an alarm triggers rollback"],
            forbidden_claims=["rollback requires a manual database command"],
            unanswerable=False,
            category="single-hop",
            tags=["deployment", "operations"],
        )
    ]


def test_rejects_a_non_array_dataset(tmp_path: Path) -> None:
    path = tmp_path / "dataset.json"
    path.write_text(json.dumps({"not": "an array"}), encoding="utf-8")

    with pytest.raises(DatasetValidationError, match="JSON array"):
        load_dataset(path)


def test_rejects_a_missing_required_field(tmp_path: Path) -> None:
    broken = dict(VALID_CASE)
    del broken["referenceAnswer"]
    path = _write(tmp_path, [broken])

    with pytest.raises(DatasetValidationError, match="referenceAnswer"):
        load_dataset(path)


def test_rejects_duplicate_case_ids(tmp_path: Path) -> None:
    path = _write(tmp_path, [VALID_CASE, VALID_CASE])

    with pytest.raises(DatasetValidationError, match="Duplicate case id"):
        load_dataset(path)


def test_summarizes_the_unanswerable_ratio(tmp_path: Path) -> None:
    unanswerable_case = {**VALID_CASE, "id": "case-002", "unanswerable": True}
    path = _write(tmp_path, [VALID_CASE, unanswerable_case])

    summary = summarize_dataset(load_dataset(path))

    assert summary.case_count == 2
    assert summary.unanswerable_count == 1
    assert summary.unanswerable_ratio == 0.5
