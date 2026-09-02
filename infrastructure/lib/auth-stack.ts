import { CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  AccountRecovery,
  OAuthScope,
  UserPool,
  VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito';
import type { UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

export interface AuthStackProps extends ApplicationStackProps {
  /** @default ['http://localhost:4200/auth/callback'] */
  readonly callbackUrls?: string[];
  /** @default ['http://localhost:4200/'] */
  readonly logoutUrls?: string[];
}

// Cognito user pool + a public (no client secret) app client using Authorization Code with PKCE
// (§4.3, ADR-0002). Cognito issues identity only — workspace membership and roles are application
// data in DynamoDB (DataStack, Week 3), never Cognito groups.
export class AuthStack extends Stack {
  readonly userPool: UserPool;
  readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${props.applicationName}-${props.environment}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      userVerification: {
        emailStyle: VerificationEmailStyle.CODE,
      },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: props.environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Globally unique across all AWS accounts, so the account ID is part of the prefix.
    const domain = this.userPool.addDomain('Domain', {
      cognitoDomain: {
        domainPrefix: `${props.applicationName}-${props.environment}-${this.account}`,
      },
    });

    // No client secret: a public SPA client cannot keep one confidential (§4.3 security
    // requirements). PKCE is applied automatically by Cognito for a public client using the
    // authorization code grant — the Angular app supplies the code_verifier/code_challenge.
    this.userPoolClient = this.userPool.addClient('WebClient', {
      generateSecret: false,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
        callbackUrls: props.callbackUrls ?? ['http://localhost:4200/auth/callback'],
        logoutUrls: props.logoutUrls ?? ['http://localhost:4200/'],
      },
      preventUserExistenceErrors: true,
    });

    new CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
    new CfnOutput(this, 'CognitoDomain', {
      value: `https://${domain.domainName}.auth.${this.region}.amazoncognito.com`,
    });
  }
}
