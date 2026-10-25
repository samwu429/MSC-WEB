import { describe, expect, it } from 'vitest';
import { MAX_SLUG_LENGTH, isSlug, suggestEventSlug } from '@msc-web/content';
import { firstFreeSlug, slugStem } from './slug-allocation';

describe('firstFreeSlug', () => {
  it('keeps a slug derived from an English title when it is free', () => {
    const base = suggestEventSlug('Mid-Autumn Night', '2026-10-03T18:30');
    expect(firstFreeSlug(base, ['2026-09-mid-autumn-night'])).toBe('2026-10-mid-autumn-night');
  });

  it('numbers a Chinese-only title, which yields only the month', () => {
    const base = suggestEventSlug('', '2026-10-03T18:30');
    expect(base).toBe('2026-10');
    expect(firstFreeSlug(base, [])).toBe('2026-10');
    expect(firstFreeSlug(base, ['2026-10'])).toBe('2026-10-2');
  });

  it('takes the first free number after collisions', () => {
    const taken = ['2026-10-gala', '2026-10-gala-2', '2026-10-gala-3', '2026-10-gala-5'];
    expect(firstFreeSlug('2026-10-gala', taken)).toBe('2026-10-gala-4');
  });

  it('ignores slugs that only share the prefix', () => {
    expect(firstFreeSlug('2026-10-gala', ['2026-10-gala-night', '2026-10-galaxy'])).toBe('2026-10-gala');
  });

  it('shortens a long slug so the numbered one still passes validation', () => {
    const base = suggestEventSlug('a'.repeat(100), '2026-10-03T18:30');
    expect(base.length).toBe(MAX_SLUG_LENGTH);
    const numbered = firstFreeSlug(base, [base]);
    expect(numbered.startsWith(slugStem(base))).toBe(true);
    expect(numbered.endsWith('-2')).toBe(true);
    expect(isSlug(numbered)).toBe(true);
  });
});

describe('slugStem', () => {
  it('is the whole base when a suffix fits', () => {
    expect(slugStem('2026-10-gala')).toBe('2026-10-gala');
  });

  it('never ends with a hyphen', () => {
    expect(slugStem(`2026-10-${'a'.repeat(63)}-bbbbbbbb`)).toMatch(/[a-z0-9]$/);
  });
});
