import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health/live (GET) reports ok without the /v1 prefix', () => {
    return request(app.getHttpServer()).get('/health/live').expect(200).expect({ status: 'ok' });
  });

  afterEach(async () => {
    await app.close();
  });
});
