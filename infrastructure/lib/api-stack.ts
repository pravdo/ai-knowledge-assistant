import { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

// Main resources (§13.1): API Gateway REST API, the NestJS control-plane Lambda, the streaming
// chat Lambda, the JWT authorizer, and throttling. Lands in Week 3 (control plane) and Week 8
// (streaming chat).
export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
  }
}
