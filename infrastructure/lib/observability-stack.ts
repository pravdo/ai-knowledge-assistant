import { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

// Main resources (§13.1): CloudWatch dashboards, alarms, log retention policies, and AWS Budgets
// notifications. Lands in Week 12.
export class ObservabilityStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
  }
}
