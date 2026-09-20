import { CfnOutput, Duration, Stack } from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Table, type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';
import { join } from 'node:path';

import type { ApplicationStackProps } from './environment.js';

export interface ApiStackProps extends ApplicationStackProps {
  readonly userPoolId: string;
  readonly userPoolClientId: string;
  readonly tableArn: string;
  readonly tableName: string;
  readonly allowedOrigins: readonly string[];
}

// Main resources (§13.1): API Gateway REST API and the NestJS control-plane Lambda. The chat
// Lambda lands separately in Week 8.
//
// A single root-level {proxy+} forwards every path to the Lambda unchanged, rather than splitting
// /health and /v1 into separate API Gateway resources with different authorizers: the Lambda
// adapter (@codegenie/serverless-express) reconstructs the Express request path from
// `event.pathParameters.proxy`, which only contains what the {proxy+} segment itself captured —
// splitting resources would silently strip the "/health" or "/v1" prefix before NestJS ever sees
// it. JwtAuthGuard inside NestJS (apps/api/src/auth/jwt-auth.guard.ts) is therefore the actual
// authorization boundary, not an API Gateway-native authorizer. Worth reintroducing a split (e.g.
// via a custom domain with path-based routing, or a request-mapping template) if the cost of
// invoking Lambda for unauthenticated traffic ever becomes a measured problem.
export class ApiStack extends Stack {
  readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const table: ITable = Table.fromTableArn(this, 'ImportedTable', props.tableArn);

    const apiFunction = new NodejsFunction(this, 'ApiFunction', {
      entry: join(__dirname, '../../apps/api/dist/lambda.js'),
      handler: 'handler',
      runtime: Runtime.NODEJS_24_X,
      memorySize: 512,
      timeout: Duration.seconds(15),
      environment: {
        ENVIRONMENT: props.environment,
        APP_TABLE_NAME: props.tableName,
        COGNITO_USER_POOL_ID: props.userPoolId,
        COGNITO_CLIENT_ID: props.userPoolClientId,
        CORS_ALLOWED_ORIGINS: props.allowedOrigins.join(','),
      },
      // esbuild is a root devDependency, not this package's: CDK runs the bundler from the repo
      // root (wherever the pnpm lockfile lives), so that is where the binary must resolve.
      // The entry is apps/api's `tsc` output, not its TypeScript source: esbuild never implements
      // emitDecoratorMetadata, so bundling .ts directly drops the constructor parameter types
      // Nest's DI needs. `pnpm build:lambda` (run by cdk.json's app command) builds it first.
      bundling: {
        // NestJS lazily references these optional peers even when unused (microservices,
        // websockets, Fastify-only Swagger static assets) — esbuild can't resolve packages that
        // aren't installed, so they must stay external. They're never actually required at
        // runtime since this app uses none of those features.
        externalModules: [
          '@nestjs/microservices',
          '@nestjs/websockets',
          'class-transformer/storage',
          '@fastify/static',
        ],
      },
    });

    table.grantReadWriteData(apiFunction);

    const api = new LambdaRestApi(this, 'RestApi', {
      restApiName: `${props.applicationName}-${props.environment}`,
      handler: apiFunction,
      proxy: true,
      // Regional, not edge-optimized: CloudFront already fronts the static web assets
      // (EdgeStack) — this API doesn't need a second, separate CloudFront distribution in front
      // of it, and edge-optimized endpoints propagate deploys through CloudFront's cache with a
      // multi-minute lag that regional endpoints don't have.
      endpointConfiguration: { types: [EndpointType.REGIONAL] },
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 20,
        throttlingBurstLimit: 10,
        // Execution logging (MethodLoggingLevel) needs a one-time, account-level CloudWatch
        // Logs role that doesn't exist yet in a fresh account — wire it up in the observability
        // chunk (ObservabilityStack) rather than here.
      },
    });

    this.apiUrl = api.url;
    new CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
