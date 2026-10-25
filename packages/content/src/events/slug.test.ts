import { describe, expect, it } from 'vitest';
import { MAX_SLUG_LENGTH, cutAtWord, isSlug, slugify, suggestEventSlug } from './slug';

describe('slugify', () => {
  it('keeps lowercase ASCII words and drops accents', () => {
    expect(slugify('Café Night: Mid-Autumn 2026!')).toBe('cafe-night-mid-autumn-2026');
    expect(slugify('中秋晚会')).toBe('');
  });

  it('cuts a long title at the last whole word that fits', () => {
    const slug = slugify('Research Writing Workshop for Every Major and Every Year at UTM Mississauga');
    expect(slug).toBe('research-writing-workshop-for-every-major-and-every-year-at-utm');
    expect(slug.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH - 8);
  });

  it('cuts a single overlong word at the limit', () => {
    expect(slugify('a'.repeat(100))).toHaveLength(MAX_SLUG_LENGTH - 8);
  });

  it('does not throw away most of the title to reach a word boundary', () => {
    expect(slugify(`ab ${'c'.repeat(100)}`)).toBe(`ab-${'c'.repeat(MAX_SLUG_LENGTH - 8 - 3)}`);
  });
});

describe('cutAtWord', () => {
  it('leaves short slugs alone and never ends with a hyphen', () => {
    expect(cutAtWord('2026-10-gala', 72)).toBe('2026-10-gala');
    expect(cutAtWord('aaaa-bbbb-', 9)).toBe('aaaa-bbbb');
  });
});

describe('suggestEventSlug', () => {
  it('starts with the year and month and stays a valid slug', () => {
    const slug = suggestEventSlug('Research Writing Workshop for Every Major and Every Year at UTM Mississauga', '2026-11-28T18:00');
    expect(slug.startsWith('2026-11-')).toBe(true);
    expect(isSlug(slug)).toBe(true);
  });
});
