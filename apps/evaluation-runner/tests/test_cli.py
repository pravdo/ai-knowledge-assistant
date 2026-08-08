import json
from pathlib import Path

from typer.testing import CliRunner

from evaluation_runner.cli import app

runner = CliRunner()

VALID_CASE = {
    "id": "case-001",
    "question": "How is a failed deployment rolled back?",
    "referenceAnswer": "It rolls back automatically.",
    "expectedDocumentIds": ["deployment-guide"],
    "expectedSections": ["Rollback strategy"],
    "requiredFacts": ["rollback is automatic"],
    "forbiddenClaims": [],
    "unanswerable": False,
    "category": "single-hop",
}


def test_validate_reports_case_count_for_a_good_dataset(tmp_path: Path) -> None:
    dataset_path = tmp_path / "dataset.json"
    dataset_path.write_text(json.dumps([VALID_CASE]), encoding="utf-8")

    result = runner.invoke(app, ["validate", str(dataset_path)])

    assert result.exit_code == 0
    assert "1 cases loaded" in result.stdout


def test_validate_exits_nonzero_for_a_broken_dataset(tmp_path: Path) -> None:
    dataset_path = tmp_path / "dataset.json"
    dataset_path.write_text(json.dumps({"not": "a list"}), encoding="utf-8")

    result = runner.invoke(app, ["validate", str(dataset_path)])

    assert result.exit_code == 1
    assert "Invalid dataset" in result.stdout
