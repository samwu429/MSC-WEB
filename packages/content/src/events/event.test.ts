import { describe, expect, it } from 'vitest';
import { eventStatus, validateEventInput } from './event';

const input = {
  slug: '',
  category: 'academic',
  status: 'published',
  title: { zh: '讲座', en: 'Talk' },
  summary: { zh: '', en: '' },
  body: { zh: '', en: '' },
  startsAt: '2026-11-01T18:00',
  endsAt: null,
  location: { zh: '', en: '' },
  coverKey: null,
  registrationUrl: null,
};

describe('validateEventInput', () => {
  it('reads whether the event was marked as ended, and treats it as running when the field is missing', () => {
    const missing = validateEventInput(input);
    expect(missing.ok && missing.value.archived).toBe(false);
    const ended = validateEventInput({ ...input, archived: true });
    expect(ended.ok && ended.value.archived).toBe(true);
  });
});

describe('eventStatus', () => {
  const event = { startsAt: '2026-11-01T18:00', endsAt: '2026-11-01T20:00', archived: false };

  it('follows the event time', () => {
    expect(eventStatus(event, '2026-10-25T12:00')).toBe('upcoming');
    expect(eventStatus(event, '2026-11-01T19:00')).toBe('ongoing');
    expect(eventStatus(event, '2026-11-02T00:00')).toBe('past');
  });

  it('counts an event marked as ended as past before its time', () => {
    expect(eventStatus({ ...event, archived: true }, '2026-10-25T12:00')).toBe('past');
  });
});
