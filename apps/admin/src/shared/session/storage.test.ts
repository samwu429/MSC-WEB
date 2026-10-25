import { describe, expect, it } from 'vitest';
import { readMemberAppToken } from './storage';

describe('readMemberAppToken', () => {
  it('reads the token the member network persists', () => {
    expect(readMemberAppToken(JSON.stringify({ state: { token: 'abc', member: {} }, version: 0 }))).toBe('abc');
  });

  it('ignores a signed-out store and malformed values', () => {
    expect(readMemberAppToken(JSON.stringify({ state: { token: null }, version: 0 }))).toBeNull();
    expect(readMemberAppToken('not json')).toBeNull();
    expect(readMemberAppToken(null)).toBeNull();
  });
});
