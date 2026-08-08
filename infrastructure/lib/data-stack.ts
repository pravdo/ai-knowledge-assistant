import { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

// Main resources (§13.1): document S3 bucket, the main application DynamoDB table, the
// idempotency table, KMS keys, and the S3 Vectors bucket/index. Lands across Weeks 3-6 as the
// operational data model, uploads, and vector storage are built.
export class DataStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
  }
}
