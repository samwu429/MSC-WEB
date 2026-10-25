import { describe, expect, it } from 'vitest';
import { matchesEntityTag } from './entity-tag';

describe('matchesEntityTag', () => {
  it('matches the stored tag, alone or in a list', () => {
    expect(matchesEntityTag('"abc"', '"abc"')).toBe(true);
    expect(matchesEntityTag('"x", "abc" , "y"', '"abc"')).toBe(true);
  });

  it('compares weakly and accepts the wildcard', () => {
    expect(matchesEntityTag('W/"abc"', '"abc"')).toBe(true);
    expect(matchesEntityTag('*', '"abc"')).toBe(true);
  });

  it('does not match other tags or a missing header', () => {
    expect(matchesEntityTag('"abd"', '"abc"')).toBe(false);
    expect(matchesEntityTag('abc', '"abc"')).toBe(false);
    expect(matchesEntityTag(undefined, '"abc"')).toBe(false);
    expect(matchesEntityTag('', '"abc"')).toBe(false);
  });
});
