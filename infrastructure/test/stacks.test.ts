import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import type { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { AiStack } from '../lib/ai-stack.js';
import { AuthStack } from '../lib/auth-stack.js';
import { DataStack } from '../lib/data-stack.js';
import { EdgeStack } from '../lib/edge-stack.js';
import type { ApplicationStackProps } from '../lib/environment.js';
import { IngestionStack } from '../lib/ingestion-stack.js';
import { ObservabilityStack } from '../lib/observability-stack.js';

// ApiStack is excluded here — it takes additional required props (Cognito/table references) and
// has its own dedicated test in api-stack.test.ts.
type StackConstructor = new (scope: Construct, id: string, props: ApplicationStackProps) => Stack;

const stackClasses: ReadonlyArray<[string, StackConstructor]> = [
  ['EdgeStack', EdgeStack],
  ['AuthStack', AuthStack],
  ['DataStack', DataStack],
  ['IngestionStack', IngestionStack],
  ['AiStack', AiStack],
  ['ObservabilityStack', ObservabilityStack],
];

describe.each(stackClasses)('%s', (_name, StackClass) => {
  it('synthesizes to a valid CloudFormation template', () => {
    const app = new App();
    const stack = new StackClass(app, 'TestStack', {
      applicationName: 'aka',
      environment: 'dev',
    });

    expect(() => Template.fromStack(stack)).not.toThrow();
  });
});
