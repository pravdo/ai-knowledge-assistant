import { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

// Main resources (§13.1): web S3 bucket, CloudFront distribution, Origin Access Control, and a
// DNS/certificate when a custom domain is used. Lands in Week 2 alongside AuthStack.
export class EdgeStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
  }
}
