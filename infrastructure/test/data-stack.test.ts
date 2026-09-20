import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { DataStack } from '../lib/data-stack.js';

function synthesize(): Template {
  const app = new App();
  const stack = new DataStack(app, 'TestData', { applicationName: 'aka', environment: 'dev' });
  return Template.fromStack(stack);
}

describe('DataStack', () => {
  it('creates the main table with the documented pk/sk schema (§6.2)', () => {
    synthesize().hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  it('creates the gsi1 user-to-workspace index', () => {
    synthesize().hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'gsi1',
          KeySchema: [
            { AttributeName: 'gsi1pk', KeyType: 'HASH' },
            { AttributeName: 'gsi1sk', KeyType: 'RANGE' },
          ],
        },
      ],
    });
  });

  it('creates exactly one table', () => {
    synthesize().resourceCountIs('AWS::DynamoDB::Table', 1);
  });
});
