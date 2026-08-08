import { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

// Main resources (§13.1): EventBridge rules, the ingestion SQS queue and DLQ, and the ingestion
// and deletion worker Lambdas. Lands in Week 5.
export class IngestionStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
  }
}
