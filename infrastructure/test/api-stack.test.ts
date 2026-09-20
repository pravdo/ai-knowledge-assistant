import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { ApiStack } from '../lib/api-stack.js';

function synthesize(): Template {
  const app = new App();
  const stack = new ApiStack(app, 'TestApi', {
    applicationName: 'aka',
    environment: 'dev',
    userPoolId: 'us-east-1_example',
    userPoolClientId: 'client-id',
    tableArn: 'arn:aws:dynamodb:us-east-1:000000000000:table/aka-dev',
    tableName: 'aka-dev',
    allowedOrigins: ['https://example.cloudfront.net'],
  });
  return Template.fromStack(stack);
}

describe('ApiStack', () => {
  const template = synthesize();

  it('creates the NestJS Lambda function with Cognito configuration wired in as environment variables', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs24.x',
      Environment: {
        Variables: {
          COGNITO_USER_POOL_ID: 'us-east-1_example',
          COGNITO_CLIENT_ID: 'client-id',
          APP_TABLE_NAME: 'aka-dev',
          CORS_ALLOWED_ORIGINS: 'https://example.cloudfront.net',
        },
      },
    });
  });

  // A single root-level {proxy+} forwards every path unchanged — see api-stack.ts for why
  // splitting /health and /v1 into separate API Gateway resources breaks path reconstruction in
  // the Lambda adapter. JwtAuthGuard inside NestJS is the actual authorization boundary.
  it('proxies every path to the Lambda without an API Gateway-native authorizer', () => {
    template.resourceCountIs('AWS::ApiGateway::Resource', 1);
    template.hasResourceProperties('AWS::ApiGateway::Resource', { PathPart: '{proxy+}' });
    template.resourceCountIs('AWS::ApiGateway::Authorizer', 0);
  });

  it('grants the Lambda read/write access to the DynamoDB table', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({ Action: Match.arrayWith(['dynamodb:PutItem']) }),
        ]),
      }),
    });
  });
});
