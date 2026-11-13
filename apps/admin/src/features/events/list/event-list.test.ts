import { describe, expect, it } from 'vitest';
import { emptyText, type SiteEvent } from '@msc-web/content';
import { filterSearchParams } from '../../../shared/api/endpoints';
import {
  CATEGORY_FILTERS,
  eventListSearchParams,
  eventListTitle,
  formatWallTime,
  hasEnded,
  inCategoryFilter,
  parseArchiveView,
  parseCategoryFilter,
  parseEventFilter,
  sortNewestFirst,
} from './event-list';

function event(overrides: Partial<SiteEvent>): SiteEvent {
  return {
    id: 'evt_1',
    slug: '2026-10-mid-autumn-night',
    category: 'extracurricular',
    status: 'published',
    title: { zh: '中秋之夜', en: 'Mid-Autumn Night' },
    summary: emptyText(),
    body: emptyText(),
    startsAt: '2026-10-25T18:30',
    endsAt: null,
    location: emptyText(),
    coverKey: null,
    registrationUrl: null,
    archived: false,
    interestClass: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('parseEventFilter and filterSearchParams', () => {
  it('reads known filters from the address', () => {
    expect(parseEventFilter(new URLSearchParams('category=academic&status=draft'))).toEqual({ category: 'academic', status: 'draft' });
  });

  it('treats missing or unknown values as all', () => {
    expect(parseEventFilter(new URLSearchParams(''))).toEqual({ category: undefined, status: undefined });
    expect(parseEventFilter(new URLSearchParams('category=review&status=archived'))).toEqual({ category: undefined, status: undefined });
  });

  it('writes only the filters that are set and reads them back unchanged', () => {
    expect(filterSearchParams({}).toString()).toBe('');
    expect(filterSearchParams({ status: 'published' }).toString()).toBe('status=published');
    const filter = { category: 'extracurricular', status: 'published' } as const;
    expect(parseEventFilter(filterSearchParams(filter))).toEqual(filter);
  });
});

describe('the 兴趣课 filter', () => {
  it('offers 兴趣课 after the two categories', () => {
    expect(CATEGORY_FILTERS.map((option) => option.label)).toEqual(['全部', '学术活动', '课外活动', '兴趣课']);
  });

  it('asks the server for academic events and keeps only the interest classes among them', () => {
    const params = new URLSearchParams('category=interest&status=published');
    expect(parseCategoryFilter(params)).toBe('interest');
    expect(parseEventFilter(params)).toEqual({ category: 'academic', status: 'published' });
    expect(inCategoryFilter(event({ category: 'academic', interestClass: true }), 'interest')).toBe(true);
    expect(inCategoryFilter(event({ category: 'academic', interestClass: false }), 'interest')).toBe(false);
    expect(inCategoryFilter(event({ category: 'extracurricular', interestClass: true }), 'interest')).toBe(false);
  });

  it('keeps every event the server sent under the other buttons', () => {
    for (const filter of [undefined, 'academic', 'extracurricular'] as const) {
      expect(inCategoryFilter(event({ category: 'academic', interestClass: false }), filter)).toBe(true);
      expect(inCategoryFilter(event({ category: 'academic', interestClass: true }), filter)).toBe(true);
    }
  });

  it('writes the list address with only the filters that are set and reads it back unchanged', () => {
    expect(eventListSearchParams({}).toString()).toBe('');
    const params = eventListSearchParams({ category: 'interest', status: 'draft', archive: 'all' });
    expect(params.toString()).toBe('category=interest&status=draft&archive=all');
    expect(parseCategoryFilter(params)).toBe('interest');
    expect(parseArchiveView(params)).toBe('all');
    expect(parseCategoryFilter(new URLSearchParams('category=interests'))).toBeUndefined();
  });
});

describe('formatWallTime', () => {
  it('shows the stored Toronto time without converting it', () => {
    expect(formatWallTime('2026-10-25T18:30')).toBe('2026-10-25 18:30');
  });
});

describe('hasEnded', () => {
  it('uses the end time when there is one', () => {
    const party = event({ startsAt: '2026-10-25T18:30', endsAt: '2026-10-25T21:00' });
    expect(hasEnded(party, '2026-10-25T21:00')).toBe(false);
    expect(hasEnded(party, '2026-10-25T21:01')).toBe(true);
  });

  it('lasts until the end of the start day when no end time is given', () => {
    const talk = event({ startsAt: '2026-10-25T18:30', endsAt: null });
    expect(hasEnded(talk, '2026-10-25T23:59')).toBe(false);
    expect(hasEnded(talk, '2026-10-26T00:00')).toBe(true);
  });

  it('is over once an officer marks it as ended, whatever its time', () => {
    expect(hasEnded(event({ startsAt: '2026-11-01T10:00', archived: true }), '2026-10-25T12:00')).toBe(true);
  });

  it('is not over before it starts', () => {
    expect(hasEnded(event({ startsAt: '2026-11-01T10:00' }), '2026-10-25T12:00')).toBe(false);
  });
});

describe('eventListTitle', () => {
  it('prefers Chinese, then English, then a placeholder', () => {
    expect(eventListTitle(event({}))).toBe('中秋之夜');
    expect(eventListTitle(event({ title: { zh: '', en: 'Research Night' } }))).toBe('Research Night');
    expect(eventListTitle(event({ title: emptyText() }))).toBe('未命名活动');
  });
});

describe('sortNewestFirst', () => {
  it('puts the latest start first without changing the input', () => {
    const early = event({ id: 'evt_early', startsAt: '2026-09-10T18:00' });
    const late = event({ id: 'evt_late', startsAt: '2026-11-02T18:00' });
    const middle = event({ id: 'evt_middle', startsAt: '2026-10-25T18:30' });
    const input = [early, late, middle];
    expect(sortNewestFirst(input).map((item) => item.id)).toEqual(['evt_late', 'evt_middle', 'evt_early']);
    expect(input.map((item) => item.id)).toEqual(['evt_early', 'evt_late', 'evt_middle']);
  });
});
