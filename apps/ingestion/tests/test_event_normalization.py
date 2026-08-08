import json

from ingestion.event_normalization import NormalizationError, normalize_event
from ingestion.models import DocumentProcessingEvent, IngestionFailureCode

VALID_EVENT = {
    "eventVersion": 1,
    "eventId": "evt-1",
    "eventType": "DocumentUploaded",
    "occurredAt": "2026-08-10T09:00:00Z",
    "correlationId": "corr-1",
    "workspaceId": "ws-7",
    "documentId": "doc-123",
    "sourceVersion": 2,
    "bucket": "document-bucket",
    "key": "source/tenants/ws-7/doc-123/2/deployment-guide.pdf",
    "objectVersionId": "s3-version-id",
    "sha256": "abc123",
}


def test_normalizes_a_well_formed_event() -> None:
    result = normalize_event(json.dumps(VALID_EVENT))

    assert isinstance(result, DocumentProcessingEvent)
    assert result.document_id == "doc-123"
    assert result.workspace_id == "ws-7"
    assert result.correlation_id == "corr-1"


def test_rejects_invalid_json() -> None:
    result = normalize_event("not json")

    assert isinstance(result, NormalizationError)
    assert result.code == IngestionFailureCode.INTERNAL


def test_rejects_missing_required_fields() -> None:
    payload = dict(VALID_EVENT)
    del payload["documentId"]

    result = normalize_event(json.dumps(payload))

    assert isinstance(result, NormalizationError)
    assert "documentId" in result.message


def test_rejects_unexpected_event_type() -> None:
    payload = {**VALID_EVENT, "eventType": "DocumentDeleted"}

    result = normalize_event(json.dumps(payload))

    assert isinstance(result, NormalizationError)


def test_rejects_a_key_outside_the_source_prefix() -> None:
    payload = {**VALID_EVENT, "key": "processed/tenants/ws-7/doc-123/2/manifest.json"}

    result = normalize_event(json.dumps(payload))

    assert isinstance(result, NormalizationError)
    assert "source prefix" in result.message
