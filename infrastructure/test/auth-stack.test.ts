import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { AuthStack } from '../lib/auth-stack.js';

function synthesize(): Template {
  const app = new App();
  const stack = new AuthStack(app, 'TestAuth', {
    applicationName: 'aka',
    environment: 'dev',
    callbackUrls: [
      'http://localhost:4200/auth/callback',
      'https://example.cloudfront.net/auth/callback',
    ],
    logoutUrls: ['http://localhost:4200/'],
  });
  return Template.fromStack(stack);
}

describe('AuthStack', () => {
  it('creates a user pool', () => {
    synthesize().resourceCountIs('AWS::Cognito::UserPool', 1);
  });

  // §4.3, §9.8: "no secret or AWS credential exists in the built JavaScript bundle" starts here —
  // a public SPA client must never have a client secret to leak.
  it('creates a public app client with no client secret, using only the authorization code grant', () => {
    synthesize().hasResourceProperties('AWS::Cognito::UserPoolClient', {
      GenerateSecret: false,
      AllowedOAuthFlows: ['code'],
      AllowedOAuthFlowsUserPoolClient: true,
    });
  });

  it('registers both the localhost and provided callback URLs', () => {
    synthesize().hasResourceProperties('AWS::Cognito::UserPoolClient', {
      CallbackURLs: Match.arrayWith([
        'http://localhost:4200/auth/callback',
        'https://example.cloudfront.net/auth/callback',
      ]),
    });
  });

  it('creates a hosted UI domain', () => {
    synthesize().resourceCountIs('AWS::Cognito::UserPoolDomain', 1);
  });
});
