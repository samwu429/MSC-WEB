import { describe, expect, it } from 'vitest';
import { readEventsQuery } from './events-query';

describe('readEventsQuery', () => {
  it('reads a known category and page', () => {
    expect(readEventsQuery({ type: 'extracurricular', page: '3' })).toEqual({ category: 'extracurricular', page: 3 });
  });

  it('shows every category for a missing or unknown type', () => {
    expect(readEventsQuery({}).category).toBeNull();
    expect(readEventsQuery({ type: 'sports' }).category).toBeNull();
    expect(readEventsQuery({ type: 'Academic' }).category).toBeNull();
  });

  it('falls back to the first page for anything that is not a whole number of at least 1', () => {
    for (const page of [undefined, '', '0', '-2', '1.5', 'two', '3abc']) {
      expect(readEventsQuery({ page }).page, String(page)).toBe(1);
    }
  });

  it('keeps very large pages past the end without letting the offset grow unbounded', () => {
    expect(readEventsQuery({ page: '250' }).page).toBe(250);
    expect(readEventsQuery({ page: '99999999' }).page).toBe(100_000);
  });
});
