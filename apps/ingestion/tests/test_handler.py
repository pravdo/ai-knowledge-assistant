import json
from typing import Any

from ingestion.handler import handler

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


def _sqs_event(bodies: list[str]) -> dict[str, Any]:
    return {
        "Records": [
            {"messageId": f"msg-{index}", "body": body} for index, body in enumerate(bodies)
        ]
    }


class _FakeLambdaContext:
    """Minimal stand-in for the attributes Powertools' Logger reads off the real context."""

    function_name = "ingestion-worker"
    memory_limit_in_mb = 512
    invoked_function_arn = "arn:aws:lambda:us-east-1:000000000000:function:ingestion-worker"
    aws_request_id = "test-request-id"

    def get_remaining_time_in_millis(self) -> int:
        return 30_000


def test_reports_no_failures_for_a_fully_valid_batch() -> None:
    result = handler(_sqs_event([json.dumps(VALID_EVENT)]), _FakeLambdaContext())

    assert result == {"batchItemFailures": []}


def test_reports_only_the_malformed_record_as_a_batch_item_failure() -> None:
    result = handler(_sqs_event([json.dumps(VALID_EVENT), "not json"]), _FakeLambdaContext())

    assert result == {"batchItemFailures": [{"itemIdentifier": "msg-1"}]}
