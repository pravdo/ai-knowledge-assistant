export interface AppEnvironment {
  readonly production: boolean;
  readonly cognito: {
    readonly issuer: string;
    readonly clientId: string;
  };
  readonly apiBaseUrl: string;
}

// Placeholder values until AuthStack/ApiStack are deployed (docs/architecture.md's "Cloud
// deployment" section). Copy the real values from `cdk deploy`'s CfnOutputs — UserPoolId and
// UserPoolClientId — into `issuer`/`clientId` below. None of this is a secret: a public SPA
// client has no client secret to protect (ADR-0002).
export const environment: AppEnvironment = {
  production: false,
  cognito: {
    // https://cognito-idp.<region>.amazonaws.com/<UserPoolId output>
    issuer: 'https://cognito-idp.REPLACE_REGION.amazonaws.com/REPLACE_USER_POOL_ID',
    // UserPoolClientId output
    clientId: 'REPLACE_WITH_USER_POOL_CLIENT_ID',
  },
  apiBaseUrl: 'http://localhost:3000',
};
