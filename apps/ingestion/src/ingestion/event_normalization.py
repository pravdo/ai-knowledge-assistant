"""Stage 1 - event normalization (docs/architecture.md §7.5).

Parses and validates the EventBridge-wrapped SQS envelope before any document content is
touched. Ownership/state verification (Stage 2) and everything downstream (secure download,
extraction, chunking, embedding, persistence) lands once the document lifecycle and DynamoDB
access layer exist.
"""

import json
from dataclasses import dataclass
from typing import Any

from ingestion.models import DocumentProcessingEvent, IngestionFailureCode

EXPECTED_EVENT_TYPE = "DocumentUploaded"
EXPECTED_SOURCE_KEY_PREFIX = "source/"

REQUIRED_FIELDS = (
    "eventVersion",
    "eventId",
    "eventType",
    "occurredAt",
    "correlationId",
    "workspaceId",
    "documentId",
    "sourceVersion",
    "bucket",
    "key",
    "objectVersionId",
    "sha256",
)


@dataclass(frozen=True, slots=True)
class NormalizationError:
    code: IngestionFailureCode
    message: str


def normalize_event(sqs_record_body: str) -> DocumentProcessingEvent | NormalizationError:
    """Parse and validate one SQS record body into a DocumentProcessingEvent.

    Rejects malformed payloads, the wrong event type, and objects outside the expected source
    prefix (§7.5 "reject objects outside the expected source prefix" — this is also what stops
    processed outputs from recursively triggering ingestion, §7.11).
    """
    try:
        payload: Any = json.loads(sqs_record_body)
    except json.JSONDecodeError:
        return NormalizationError(
            IngestionFailureCode.INTERNAL, "SQS record body is not valid JSON."
        )

    if not isinstance(payload, dict):
        return NormalizationError(
            IngestionFailureCode.INTERNAL, "Event payload must be a JSON object."
        )

    missing = [field for field in REQUIRED_FIELDS if field not in payload]
    if missing:
        return NormalizationError(
            IngestionFailureCode.INTERNAL,
            f"Event payload is missing fields: {', '.join(missing)}.",
        )

    if payload["eventType"] != EXPECTED_EVENT_TYPE:
        return NormalizationError(
            IngestionFailureCode.INTERNAL, f"Unexpected eventType: {payload['eventType']!r}."
        )

    key = str(payload["key"])
    if not key.startswith(EXPECTED_SOURCE_KEY_PREFIX):
        return NormalizationError(
            IngestionFailureCode.INTERNAL,
            f"Object key {key!r} is outside the expected source prefix.",
        )

    return DocumentProcessingEvent(
        event_version=int(payload["eventVersion"]),
        event_id=str(payload["eventId"]),
        event_type=str(payload["eventType"]),
        occurred_at=str(payload["occurredAt"]),
        correlation_id=str(payload["correlationId"]),
        workspace_id=str(payload["workspaceId"]),
        document_id=str(payload["documentId"]),
        source_version=int(payload["sourceVersion"]),
        bucket=str(payload["bucket"]),
        key=key,
        object_version_id=str(payload["objectVersionId"]),
        sha256=str(payload["sha256"]),
    )
