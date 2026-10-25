import { describe, expect, it } from 'vitest';
import type { ReviewSessionDetail, TermKey } from '@msc-web/content';
import { groupSessionsByTerm, selectTerm, termTabs } from './review-terms';

function session(id: string, term: TermKey): ReviewSessionDetail {
  return {
    id,
    courseId: 'crs_1',
    term,
    exam: 'midterm',
    status: 'published',
    title: { zh: '', en: '' },
    startsAt: null,
    endsAt: null,
    mode: 'online',
    location: { zh: '', en: '' },
    presenters: '',
    registrationUrl: null,
    recordingUrl: null,
    notes: { zh: '', en: '' },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    materials: [],
  };
}

describe('termTabs', () => {
  it('adds the current term once and orders terms newest first', () => {
    expect(termTabs(['2025-fall', '2026-winter'], '2026-fall')).toEqual(['2026-fall', '2026-winter', '2025-fall']);
    expect(termTabs(['2026-fall', '2026-summer'], '2026-fall')).toEqual(['2026-fall', '2026-summer']);
  });
});

describe('selectTerm', () => {
  const tabs: TermKey[] = ['2026-fall', '2026-winter'];

  it('selects a requested term that has a tab', () => {
    expect(selectTerm('2026-winter', tabs, '2026-fall')).toBe('2026-winter');
  });

  it('falls back to the current term for missing, malformed or unlisted terms', () => {
    for (const requested of [undefined, '', 'winter-2026', '2026-spring', '2024-fall']) {
      expect(selectTerm(requested, tabs, '2026-fall'), String(requested)).toBe('2026-fall');
    }
  });
});

describe('groupSessionsByTerm', () => {
  it('groups by term, newest first, keeping the order inside each term', () => {
    const groups = groupSessionsByTerm([session('a', '2026-winter'), session('b', '2026-fall'), session('c', '2026-winter'), session('d', '2025-fall')]);
    expect(groups.map((group) => [group.term, group.sessions.map((entry) => entry.id)])).toEqual([
      ['2026-fall', ['b']],
      ['2026-winter', ['a', 'c']],
      ['2025-fall', ['d']],
    ]);
  });
});
