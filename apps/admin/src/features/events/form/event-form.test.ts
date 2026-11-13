import { describe, expect, it } from 'vitest';
import { validateEventInput, type SiteEventDetail } from '@msc-web/content';
import { categoryChange, emptyEventInput, publicEventPath, toEventInput } from './event-form';

const detail: SiteEventDetail = {
  ...emptyEventInput(),
  id: 'evt_1',
  slug: '2026-10-mid-autumn-night',
  status: 'published',
  title: { zh: '中秋之夜', en: 'Mid-Autumn Night' },
  summary: { zh: '一起赏月吃月饼。', en: 'Mooncakes under the moon.' },
  startsAt: '2026-10-25T18:30',
  endsAt: '2026-10-25T21:00',
  coverKey: 'img/2026/0123456789abcdef0123456789abcdef.jpg',
  registrationUrl: 'https://example.com/register',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
  photos: [
    {
      id: 'pho_1',
      eventId: 'evt_1',
      mediaKey: 'img/2026/fedcba9876543210fedcba9876543210.jpg',
      caption: { zh: '', en: '' },
      sortOrder: 0,
      createdAt: '2026-10-26T00:00:00.000Z',
    },
  ],
};

describe('toEventInput', () => {
  it('leaves out the gallery and record fields', () => {
    const input = toEventInput(detail);
    expect(input).not.toHaveProperty('photos');
    expect(input).not.toHaveProperty('id');
    expect(input).not.toHaveProperty('updatedAt');
  });

  it('produces a body the shared validator accepts unchanged', () => {
    const input = toEventInput(detail);
    expect(validateEventInput(input)).toEqual({ ok: true, value: input });
  });

  it('keeps the interest class mark, and the validator accepts it on an academic event', () => {
    const interestClass = { ...detail, category: 'academic' as const, interestClass: true };
    const input = toEventInput(interestClass);
    expect(input.interestClass).toBe(true);
    expect(validateEventInput(input)).toEqual({ ok: true, value: input });
  });

  it('drops a mark left on an event of another category, so the form can still save it', () => {
    const stray = toEventInput({ ...detail, category: 'extracurricular', interestClass: true });
    expect(stray.interestClass).toBe(false);
    expect(validateEventInput(stray)).toEqual({ ok: true, value: stray });
  });
});

describe('categoryChange', () => {
  it('keeps the interest class mark while the event stays academic', () => {
    expect(categoryChange('academic')).toEqual({ category: 'academic' });
  });

  it('clears the mark when the event becomes extracurricular, so the form never sends what the validator refuses', () => {
    const marked = { ...emptyEventInput(), title: { zh: '讲座', en: '' }, startsAt: '2026-11-01T18:00', interestClass: true };
    const changed = { ...marked, ...categoryChange('extracurricular') };
    expect(changed).toMatchObject({ category: 'extracurricular', interestClass: false });
    expect(validateEventInput(changed).ok).toBe(true);
    const back = { ...changed, ...categoryChange('academic') };
    expect(back).toMatchObject({ category: 'academic', interestClass: false });
  });

  it('reports a mark left on an extracurricular event at the checkbox the form shows', () => {
    const result = validateEventInput({ ...emptyEventInput(), title: { zh: '讲座', en: '' }, startsAt: '2026-11-01T18:00', category: 'extracurricular', interestClass: true });
    expect(result).toEqual({ ok: false, issues: [{ field: 'interestClass', message: '只有学术活动可以标为兴趣课' }] });
  });
});

describe('emptyEventInput', () => {
  it('starts as a draft and asks only for the title and start time, at paths the form controls show', () => {
    expect(emptyEventInput().status).toBe('draft');
    expect(emptyEventInput().interestClass).toBe(false);
    const result = validateEventInput(emptyEventInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.field).sort()).toEqual(['startsAt', 'title.zh']);
  });
});

describe('publicEventPath', () => {
  it('points at the Chinese event page', () => {
    expect(publicEventPath('2026-10-mid-autumn-night')).toBe('/events/2026-10-mid-autumn-night');
  });
});
