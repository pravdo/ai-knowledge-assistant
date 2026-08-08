import { describe, expect, it } from 'vitest';

import { roleSatisfies } from './workspace-role.js';

describe('roleSatisfies', () => {
  it('lets an OWNER perform anything', () => {
    expect(roleSatisfies('OWNER', 'VIEWER')).toBe(true);
    expect(roleSatisfies('OWNER', 'EDITOR')).toBe(true);
    expect(roleSatisfies('OWNER', 'OWNER')).toBe(true);
  });

  it('lets a VIEWER perform only VIEWER actions', () => {
    expect(roleSatisfies('VIEWER', 'VIEWER')).toBe(true);
    expect(roleSatisfies('VIEWER', 'EDITOR')).toBe(false);
    expect(roleSatisfies('VIEWER', 'OWNER')).toBe(false);
  });

  it('lets an EDITOR perform EDITOR and VIEWER actions but not OWNER actions', () => {
    expect(roleSatisfies('EDITOR', 'VIEWER')).toBe(true);
    expect(roleSatisfies('EDITOR', 'EDITOR')).toBe(true);
    expect(roleSatisfies('EDITOR', 'OWNER')).toBe(false);
  });
});
