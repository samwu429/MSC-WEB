import { describe, expect, it } from 'vitest';
import { eventKindLabel, eventStatus, isInterestClass, validateEventInput } from './event';

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

  it('reads whether an academic event is an interest class, and treats it as an ordinary event when the field is missing', () => {
    const missing = validateEventInput(input);
    expect(missing.ok && missing.value.interestClass).toBe(false);
    const marked = validateEventInput({ ...input, interestClass: true });
    expect(marked.ok && marked.value.interestClass).toBe(true);
  });

  it('marks only academic events as interest classes', () => {
    expect(validateEventInput({ ...input, category: 'extracurricular', interestClass: true })).toEqual({
      ok: false,
      issues: [{ field: 'interestClass', message: '只有学术活动可以标为兴趣课' }],
    });
    const unmarked = validateEventInput({ ...input, category: 'extracurricular', interestClass: false });
    expect(unmarked.ok && unmarked.value.interestClass).toBe(false);
  });

  it('refuses a mark that is not true or false', () => {
    expect(validateEventInput({ ...input, interestClass: 'yes' })).toEqual({
      ok: false,
      issues: [{ field: 'interestClass', message: '是否为兴趣课格式不正确' }],
    });
  });
});

describe('isInterestClass and eventKindLabel', () => {
  it('names an interest class by its own label and every other event by its category', () => {
    expect(isInterestClass({ category: 'academic', interestClass: true })).toBe(true);
    expect(eventKindLabel({ category: 'academic', interestClass: true })).toEqual({ zh: '兴趣课', en: 'Interest Class' });
    expect(isInterestClass({ category: 'academic', interestClass: false })).toBe(false);
    expect(eventKindLabel({ category: 'academic', interestClass: false })).toEqual({ zh: '学术活动', en: 'Academic' });
    expect(eventKindLabel({ category: 'extracurricular', interestClass: false })).toEqual({ zh: '课外活动', en: 'Extracurricular' });
  });

  it('never counts an event of another category as an interest class, even with the mark left on it', () => {
    expect(isInterestClass({ category: 'extracurricular', interestClass: true })).toBe(false);
    expect(eventKindLabel({ category: 'extracurricular', interestClass: true })).toEqual({ zh: '课外活动', en: 'Extracurricular' });
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
