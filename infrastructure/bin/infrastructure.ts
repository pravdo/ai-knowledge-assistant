#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';

import { AiStack } from '../lib/ai-stack.js';
import { ApiStack } from '../lib/api-stack.js';
import { AuthStack } from '../lib/auth-stack.js';
import { DataStack } from '../lib/data-stack.js';
import { EdgeStack } from '../lib/edge-stack.js';
import type { DeploymentEnvironment } from '../lib/environment.js';
import { IngestionStack } from '../lib/ingestion-stack.js';
import { ObservabilityStack } from '../lib/observability-stack.js';

const APPLICATION_NAME = 'aka';

const app = new App();

const environment = (app.node.tryGetContext('environment') ??
  process.env['CDK_ENVIRONMENT'] ??
  'dev') as DeploymentEnvironment;

// §2.5: development environments allow lower retention and disposable resources; staging and
// production keep production-like topology. Do not reuse a production knowledge index in dev.
const env = {
  account: process.env['CDK_DEFAULT_ACCOUNT'],
  region: process.env['CDK_DEFAULT_REGION'],
};

function stackId(name: string): string {
  return `${APPLICATION_NAME}-${environment}-${name}`;
}

const stacks = [
  new EdgeStack(app, stackId('Edge'), { env, applicationName: APPLICATION_NAME, environment }),
  new AuthStack(app, stackId('Auth'), { env, applicationName: APPLICATION_NAME, environment }),
  new DataStack(app, stackId('Data'), { env, applicationName: APPLICATION_NAME, environment }),
  new ApiStack(app, stackId('Api'), { env, applicationName: APPLICATION_NAME, environment }),
  new IngestionStack(app, stackId('Ingestion'), {
    env,
    applicationName: APPLICATION_NAME,
    environment,
  }),
  new AiStack(app, stackId('Ai'), { env, applicationName: APPLICATION_NAME, environment }),
  new ObservabilityStack(app, stackId('Observability'), {
    env,
    applicationName: APPLICATION_NAME,
    environment,
  }),
];

for (const stack of stacks) {
  Tags.of(stack).add('application', APPLICATION_NAME);
  Tags.of(stack).add('environment', environment);
}
