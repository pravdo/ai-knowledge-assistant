import { Module } from '@nestjs/common';

// Issues short-lived, exact-key presigned uploads. Never accepts a client-provided S3 key.
@Module({})
export class UploadsModule {}
