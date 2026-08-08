import { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

// Main resources (§13.1): Bedrock model access/permissions, model and guardrail configuration,
// and NVIDIA provider secret references. Lands in Week 7 (Bedrock baseline) and Week 14 (NVIDIA).
export class AiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
  }
}
