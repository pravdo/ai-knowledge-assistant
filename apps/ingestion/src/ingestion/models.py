"""Data shapes shared across ingestion worker stages.

Mirrors packages/contracts/src/processing-event.ts so the TypeScript and Python sides agree on the
document-processing event shape (docs/architecture.md Appendix A.2).
"""

from dataclasses import dataclass
from enum import StrEnum


class IngestionFailureCode(StrEnum):
    """Internal job failure reasons stored on the document record (docs/architecture.md §7.8).

    Distinct from packages/contracts' client-facing StableErrorCode: these describe *why an
    ingestion job failed*, not what an API caller should see.
    """

    UNSUPPORTED_TYPE = "FAILED_UNSUPPORTED_TYPE"
    PARSE = "FAILED_PARSE"
    SIZE_LIMIT = "FAILED_SIZE_LIMIT"
    CONFIGURATION = "FAILED_CONFIGURATION"
    INTERNAL = "FAILED_INTERNAL"


@dataclass(frozen=True, slots=True)
class DocumentProcessingEvent:
    """The event an S3 upload produces via EventBridge, consumed off SQS (Appendix A.2)."""

    event_version: int
    event_id: str
    event_type: str
    occurred_at: str
    correlation_id: str
    workspace_id: str
    document_id: str
    source_version: int
    bucket: str
    key: str
    object_version_id: str
    sha256: str
