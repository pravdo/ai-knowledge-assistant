import { CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  AccessLevel,
  Distribution,
  type ErrorResponse,
  PriceClass,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

import type { ApplicationStackProps } from './environment.js';

// SPA client-side routes (e.g. /workspaces/ws-1) have no matching S3 key, so both "not found" and
// "access denied" from the private bucket must fall back to index.html for Angular's router to
// handle them, rather than surfacing a raw S3/CloudFront error page.
function spaFallback(httpStatus: number): ErrorResponse {
  return {
    httpStatus,
    responseHttpStatus: 200,
    responsePagePath: '/index.html',
    ttl: Duration.minutes(5),
  };
}

// Main resources (§13.1): private web S3 bucket, CloudFront distribution reading it through
// Origin Access Control (never a public bucket/website origin — §2.1, §9.8 security acceptance
// criteria). The built Angular app (apps/web/dist/web) is deployed separately — see
// docs/architecture.md's local development / cloud deployment sections — so this stack synthesizes
// independently of whether the app has been built yet.
export class EdgeStack extends Stack {
  readonly webBucketName: string;
  readonly distributionDomainName: string;
  readonly distributionId: string;

  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    const webBucket = new Bucket(this, 'WebBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: props.environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== 'prod',
    });

    const distribution = new Distribution(this, 'Distribution', {
      comment: `${props.applicationName}-${props.environment}`,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(webBucket, {
          originAccessLevels: [AccessLevel.READ],
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [spaFallback(404), spaFallback(403)],
      // Cheaper edge footprint (North America + Europe only) outside prod; prod uses all edge
      // locations (PriceClass.PRICE_CLASS_ALL, the CDK default) for global latency.
      priceClass: props.environment === 'prod' ? undefined : PriceClass.PRICE_CLASS_100,
    });

    this.webBucketName = webBucket.bucketName;
    this.distributionDomainName = distribution.distributionDomainName;
    this.distributionId = distribution.distributionId;

    new CfnOutput(this, 'WebBucketName', { value: webBucket.bucketName });
    new CfnOutput(this, 'DistributionDomainName', { value: distribution.distributionDomainName });
    new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
  }
}
