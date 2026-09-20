import serverlessExpress from '@codegenie/serverless-express';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler } from 'aws-lambda';

import { createApp } from './bootstrap.js';

// Cached across warm invocations so the Nest app (and everything it initializes — DynamoDB
// client, JWKS fetch for JwtAuthGuard) is built once per execution environment, not per request
// (§10.2 Lambda practices).
let cachedHandler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> | undefined;

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    cachedHandler = serverlessExpress({ app: app.getHttpAdapter().getInstance() });
  }

  // @codegenie/serverless-express's configured handler always resolves via the returned promise
  // (verified against its implementation); the callback param exists only for structural
  // compatibility with Lambda's Handler type, so it's never invoked here.
  return cachedHandler(event, context, () => {}) as Promise<APIGatewayProxyResult>;
}
