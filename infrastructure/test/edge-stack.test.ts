import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { EdgeStack } from '../lib/edge-stack.js';

function synthesize(environment: 'dev' | 'prod' = 'dev'): Template {
  const app = new App();
  const stack = new EdgeStack(app, 'TestEdge', { applicationName: 'aka', environment });
  return Template.fromStack(stack);
}

describe('EdgeStack', () => {
  // §9.8 security acceptance criteria: "buckets reject public reads."
  it('blocks all public access on the web bucket', () => {
    synthesize().hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('does not configure the bucket as an S3 static website', () => {
    synthesize().hasResourceProperties('AWS::S3::Bucket', {
      WebsiteConfiguration: Match.absent(),
    });
  });

  // CloudFront must read the bucket through Origin Access Control, not a public origin.
  it('creates exactly one Origin Access Control for the distribution', () => {
    synthesize().resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
  });

  it('creates a CloudFront distribution redirecting to HTTPS', () => {
    synthesize().hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultCacheBehavior: Match.objectLike({ ViewerProtocolPolicy: 'redirect-to-https' }),
      }),
    });
  });

  it('uses a cheaper price class outside prod', () => {
    synthesize('dev').hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({ PriceClass: 'PriceClass_100' }),
    });
  });
});
