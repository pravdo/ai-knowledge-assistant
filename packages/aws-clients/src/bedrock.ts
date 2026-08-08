import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

let bedrockRuntimeClient: BedrockRuntimeClient | undefined;

export function getBedrockRuntimeClient(): BedrockRuntimeClient {
  bedrockRuntimeClient ??= new BedrockRuntimeClient({});
  return bedrockRuntimeClient;
}
