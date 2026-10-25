import { describe, expect, it } from 'vitest';
import { ROLE_SITE_PERMISSIONS, type SummaryResponse } from '@msc-web/content';
import { summaryCards } from './summary-cards';

const COUNTS: SummaryResponse['counts'] = {
  people: 18,
  eventsPublished: 12,
  eventsDraft: 3,
  upcomingEvents: 2,
  courses: 7,
  reviewSessions: 21,
  documents: 5,
};

describe('summaryCards', () => {
  it('gives an officer who edits everything a card for every counted section, in sidebar order', () => {
    const cards = summaryCards(COUNTS, ROLE_SITE_PERMISSIONS.president);
    expect(cards.map((card) => card.to)).toEqual(['/events', '/reviews', '/people', '/documents']);
    expect(cards[0]).toEqual({ to: '/events', title: '活动', value: 12, unit: '场已发布', detail: '即将举行 2 · 草稿 3' });
    expect(cards[1]).toMatchObject({ value: 7, detail: '复习场次 21' });
  });

  it('shows only the sections a role may open', () => {
    expect(summaryCards(COUNTS, ROLE_SITE_PERMISSIONS.vp_finance)).toEqual([{ to: '/documents', title: '公开文件', value: 5, unit: '份文件', detail: null }]);
    expect(summaryCards(COUNTS, ROLE_SITE_PERMISSIONS.head_academic).map((card) => card.to)).toEqual(['/events', '/reviews']);
  });

  it('has no card for site settings, which has nothing to count', () => {
    expect(summaryCards(COUNTS, ['settings.edit'])).toEqual([]);
  });
});
