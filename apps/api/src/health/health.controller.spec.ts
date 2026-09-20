import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';

async function createController(config: Record<string, string>): Promise<HealthController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [{ provide: ConfigService, useValue: { get: (key: string) => config[key] } }],
  }).compile();

  return module.get(HealthController);
}

describe('HealthController', () => {
  it('reports ok on the liveness endpoint without checking configuration', async () => {
    const controller = await createController({});
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('reports ok on readiness when required configuration is present', async () => {
    const controller = await createController({
      APP_TABLE_NAME: 'aka-dev',
      COGNITO_USER_POOL_ID: 'us-east-1_example',
      COGNITO_CLIENT_ID: 'client-id',
    });
    expect(controller.ready()).toEqual({ status: 'ok' });
  });

  it('fails readiness when required configuration is missing', async () => {
    const controller = await createController({ APP_TABLE_NAME: 'aka-dev' });
    expect(() => controller.ready()).toThrow('Missing required configuration');
  });
});
