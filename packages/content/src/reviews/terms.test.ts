import { describe, expect, it } from 'vitest';
import { compareTerms, isTermKey, nearbyTerms, termLabel, termOfDate } from './terms';

describe('terms', () => {
  it('places dates in the UTM term they fall in', () => {
    expect(termOfDate('2026-01-05')).toBe('2026-winter');
    expect(termOfDate('2026-04-30')).toBe('2026-winter');
    expect(termOfDate('2026-05-01')).toBe('2026-summer');
    expect(termOfDate('2026-09-02')).toBe('2026-fall');
    expect(termOfDate('2026-12-20')).toBe('2026-fall');
  });

  it('orders terms chronologically', () => {
    const terms = ['2026-fall', '2026-winter', '2025-fall', '2026-summer'] as const;
    expect([...terms].sort(compareTerms)).toEqual(['2025-fall', '2026-winter', '2026-summer', '2026-fall']);
  });

  it('validates keys', () => {
    expect(isTermKey('2026-fall')).toBe(true);
    expect(isTermKey('2026-spring')).toBe(false);
    expect(isTermKey('1999-fall')).toBe(false);
  });

  it('labels terms in both languages', () => {
    expect(termLabel('2026-fall')).toEqual({ zh: '2026 秋季学期', en: 'Fall 2026' });
  });

  it('offers the terms around a date across a year boundary', () => {
    expect(nearbyTerms('2026-10-25')).toEqual(['2026-summer', '2026-fall', '2027-winter', '2027-summer']);
    expect(nearbyTerms('2026-02-01')).toEqual(['2025-fall', '2026-winter', '2026-summer', '2026-fall']);
  });
});
