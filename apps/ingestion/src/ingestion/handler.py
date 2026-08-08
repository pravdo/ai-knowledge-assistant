"""Lambda entrypoint: SQS -> event normalization (Stage 1 only; see event_normalization.py).

Uses a partial batch response so one malformed record does not cause successfully-normalized
records to be retried alongside it (§10.3, §7.11 "partial SQS failures retry only failed
records"). Stages 2-8 (ownership verification through active-version promotion) are not wired yet.
"""

from typing import Any

from aws_lambda_powertools import Logger

from ingestion.event_normalization import NormalizationError, normalize_event

logger = Logger(service="ingestion")


@logger.inject_lambda_context(log_event=False)
def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    batch_item_failures: list[dict[str, str]] = []

    for record in event.get("Records", []):
        message_id = record["messageId"]
        result = normalize_event(record["body"])

        if isinstance(result, NormalizationError):
            logger.warning(
                "rejected malformed processing event",
                messageId=message_id,
                errorCode=result.code,
            )
            batch_item_failures.append({"itemIdentifier": message_id})
            continue

        logger.info(
            "normalized processing event",
            messageId=message_id,
            correlationId=result.correlation_id,
            workspaceId=result.workspace_id,
            documentId=result.document_id,
        )

    return {"batchItemFailures": batch_item_failures}
