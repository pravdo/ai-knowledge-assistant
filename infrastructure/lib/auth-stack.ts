import { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

// Main resources (§13.1): Cognito user pool, app client (Authorization Code with PKCE), hosted
// domain, and optional MFA/federation. Lands in Week 2.
export class AuthStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
  }
}
