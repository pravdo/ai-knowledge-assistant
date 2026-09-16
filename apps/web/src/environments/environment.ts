export interface AppEnvironment {
  readonly production: boolean;
  readonly cognito: {
    readonly issuer: string;
    readonly clientId: string;
  };
  readonly apiBaseUrl: string;
}

// aka-dev-Auth, deployed 2026-09-16 (AWS account 028987315210, us-east-1). None of this is a
// secret: a public SPA client has no client secret to protect (ADR-0002). ApiStack (apiBaseUrl)
// is not deployed yet — see docs/architecture.md's "Cloud deployment" section.
export const environment: AppEnvironment = {
  production: false,
  cognito: {
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_aW2yjHU8F',
    clientId: '4qj4q0tdsvhkia9v29abbg958o',
  },
  apiBaseUrl: 'http://localhost:3000',
};
