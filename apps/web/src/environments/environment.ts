export interface AppEnvironment {
  readonly production: boolean;
  readonly cognito: {
    readonly issuer: string;
    readonly clientId: string;
  };
  readonly apiBaseUrl: string;
}

export const environment: AppEnvironment = {
  production: false,
  cognito: {
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_aW2yjHU8F',
    clientId: '4qj4q0tdsvhkia9v29abbg958o',
  },
  apiBaseUrl: 'https://n92c5080p9.execute-api.us-east-1.amazonaws.com/dev',
};
