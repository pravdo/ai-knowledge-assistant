import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';

import { HealthController } from './health.controller';

async function createController(config: Record<string, string>): Promise<HealthController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [{ provide: ConfigService, useValue: { get: (key: string) => config[key] } }],
  }).compile();

  return module.get(HealthController);
}

function createResponse() {
  const status = jest.fn();
  return { response: { status } as unknown as Response, status };
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
    const { response, status } = createResponse();

    expect(controller.ready(response)).toEqual({ status: 'ok' });
    expect(status).not.toHaveBeenCalled();
  });

  it('fails readiness when required configuration is missing', async () => {
    const controller = await createController({ APP_TABLE_NAME: 'aka-dev' });
    const { response, status } = createResponse();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(controller.ready(response)).toEqual({ status: 'unavailable' });
    expect(status).toHaveBeenCalledWith(503);
    logSpy.mockRestore();
  });
});
