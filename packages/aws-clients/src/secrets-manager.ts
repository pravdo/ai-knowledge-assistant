import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

let secretsManagerClient: SecretsManagerClient | undefined;

export function getSecretsManagerClient(): SecretsManagerClient {
  secretsManagerClient ??= new SecretsManagerClient({});
  return secretsManagerClient;
}
