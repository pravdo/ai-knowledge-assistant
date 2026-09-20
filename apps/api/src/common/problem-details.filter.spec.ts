import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

import { ProblemDetailsException } from './problem-details.exception';
import { ProblemDetailsFilter } from './problem-details.filter';

function createHost() {
  const response = {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe('ProblemDetailsFilter', () => {
  const filter = new ProblemDetailsFilter();

  it('maps a ProblemDetailsException to its stable shape and status', () => {
    const { host, response } = createHost();

    filter.catch(new ProblemDetailsException('WORKSPACE_ACCESS_DENIED', 'nope'), host);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'WORKSPACE_ACCESS_DENIED',
        detail: 'nope',
        retryable: false,
      }),
    );
  });

  it('marks a retryable code as retryable', () => {
    const { host, response } = createHost();

    filter.catch(new ProblemDetailsException('MODEL_THROTTLED', 'try later'), host);

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ retryable: true }));
  });

  it('maps a Nest validation error to VALIDATION_FAILED', () => {
    const { host, response } = createHost();

    filter.catch(new BadRequestException(['name should not be empty']), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'VALIDATION_FAILED', detail: 'name should not be empty' }),
    );
  });

  it('maps an unknown error to INTERNAL_ERROR without leaking its message to the client', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { host, response } = createHost();

    filter.catch(new Error('database connection string: secret'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    const body = (response.json.mock.calls[0] as [{ type: string; detail: string }])[0];
    expect(body.type).toBe('INTERNAL_ERROR');
    expect(body.detail).not.toContain('secret');
    logSpy.mockRestore();
  });
});
