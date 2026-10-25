import { describe, expect, it } from 'vitest';
import type { TermKey } from '@msc-web/content';
import { groupByTerm } from './session-groups';

const session = (id: string, term: TermKey) => ({ id, term });

describe('groupByTerm', () => {
  it('keeps the returned order of terms and of sessions within each term', () => {
    const groups = groupByTerm([session('a', '2026-fall'), session('b', '2026-fall'), session('c', '2026-summer'), session('d', '2026-fall')]);
    expect(groups.map((group) => group.term)).toEqual(['2026-fall', '2026-summer']);
    expect(groups[0]?.sessions.map((item) => item.id)).toEqual(['a', 'b', 'd']);
    expect(groups[1]?.sessions.map((item) => item.id)).toEqual(['c']);
  });

  it('returns no groups for a course without sessions', () => {
    expect(groupByTerm([])).toEqual([]);
  });
});
