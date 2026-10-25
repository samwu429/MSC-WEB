import { describe, expect, it } from 'vitest';
import type { ReviewSession } from '@msc-web/content';
import { sessionDraftOf, sessionInputOf, termChoices } from './session-draft';

const SAVED: ReviewSession = {
  id: 'rvs_1',
  courseId: 'crs_1',
  term: '2025-winter',
  exam: 'final',
  status: 'published',
  title: { zh: '第 1-5 章', en: 'Chapters 1-5' },
  startsAt: null,
  endsAt: null,
  mode: 'online',
  location: { zh: '', en: 'Zoom' },
  presenters: '张三、李四',
  registrationUrl: 'https://example.com/register',
  recordingUrl: null,
  notes: { zh: '', en: '' },
  createdAt: '2025-01-10T00:00:00.000Z',
  updatedAt: '2025-01-11T00:00:00.000Z',
};

describe('sessionDraftOf', () => {
  it('starts a new session as an in-person midterm draft in the current term', () => {
    const draft = sessionDraftOf(null, '2026-10-25');
    expect(draft).toMatchObject({ term: '2026-fall', exam: 'midterm', status: 'draft', mode: 'in_person', startsAt: '', endsAt: '' });
  });

  it('turns missing times and links of a saved session into empty fields', () => {
    const draft = sessionDraftOf(SAVED, '2026-10-25');
    expect(draft.startsAt).toBe('');
    expect(draft.recordingUrl).toBe('');
    expect(draft.registrationUrl).toBe('https://example.com/register');
  });
});

describe('sessionInputOf', () => {
  it('round-trips a saved session unchanged', () => {
    const input = sessionInputOf(sessionDraftOf(SAVED, '2026-10-25'));
    expect(input).toEqual({
      term: SAVED.term,
      exam: SAVED.exam,
      status: SAVED.status,
      title: SAVED.title,
      startsAt: null,
      endsAt: null,
      mode: SAVED.mode,
      location: SAVED.location,
      presenters: SAVED.presenters,
      registrationUrl: SAVED.registrationUrl,
      recordingUrl: null,
      notes: SAVED.notes,
    });
  });

  it('sends empty times and blank links as none and trims links', () => {
    const draft = { ...sessionDraftOf(null, '2026-10-25'), startsAt: '2026-11-02T18:00', registrationUrl: '  https://example.com/a  ', recordingUrl: '   ' };
    const input = sessionInputOf(draft);
    expect(input.startsAt).toBe('2026-11-02T18:00');
    expect(input.endsAt).toBeNull();
    expect(input.registrationUrl).toBe('https://example.com/a');
    expect(input.recordingUrl).toBeNull();
  });
});

describe('termChoices', () => {
  it('offers the terms around today in chronological order', () => {
    expect(termChoices('2026-10-25', null)).toEqual(['2026-summer', '2026-fall', '2027-winter', '2027-summer']);
  });

  it('keeps an older saved term selectable without duplicating a nearby one', () => {
    expect(termChoices('2026-10-25', '2025-winter')).toEqual(['2025-winter', '2026-summer', '2026-fall', '2027-winter', '2027-summer']);
    expect(termChoices('2026-10-25', '2026-fall')).toEqual(['2026-summer', '2026-fall', '2027-winter', '2027-summer']);
  });
});
