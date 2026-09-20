import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateWorkspaceDto } from './create-workspace.dto';

async function errorsFor(body: object): Promise<string[]> {
  const errors = await validate(plainToInstance(CreateWorkspaceDto, body));
  return errors.map((error) => error.property);
}

describe('CreateWorkspaceDto', () => {
  it('accepts a name with and without a description', async () => {
    expect(await errorsFor({ name: 'Docs' })).toEqual([]);
    expect(await errorsFor({ name: 'Docs', description: 'Engineering docs' })).toEqual([]);
  });

  it('rejects a whitespace-only name', async () => {
    expect(await errorsFor({ name: '   ' })).toEqual(['name']);
  });

  it('trims surrounding whitespace from the name', () => {
    const dto = plainToInstance(CreateWorkspaceDto, { name: '  Docs  ' });
    expect(dto.name).toBe('Docs');
  });

  it('rejects a name over 100 characters and a description over 500', async () => {
    expect(await errorsFor({ name: 'a'.repeat(101) })).toEqual(['name']);
    expect(await errorsFor({ name: 'Docs', description: 'a'.repeat(501) })).toEqual([
      'description',
    ]);
  });
});
