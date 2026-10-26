import { describe, expect, it } from 'vitest';
import { emptyText, type Person } from '@msc-web/content';
import { buildPeopleBoard, personTitle, photoPlaceholder } from './people-board';

let counter = 0;

function person(overrides: Partial<Person>): Person {
  counter += 1;
  return {
    id: `per_${counter}`,
    section: 'presidium',
    position: 'president',
    department: null,
    name: { zh: '张三', en: 'San Zhang' },
    title: emptyText(),
    affiliation: emptyText(),
    bio: emptyText(),
    photoKey: null,
    email: null,
    linkUrl: null,
    sortOrder: 0,
    visible: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildPeopleBoard', () => {
  it('lists every office in constitution order, including vacant ones', () => {
    const board = buildPeopleBoard([]);
    expect(board.presidium.map((slot) => slot.position)).toEqual(['president', 'secretary_general', 'vp_finance', 'vp_audit']);
    expect(board.presidium.every((slot) => slot.people.length === 0)).toBe(true);
    expect(board.departments.map((slot) => slot.department)).toEqual(['technology', 'academic', 'publicity', 'sponsorship', 'events']);
    expect(board.advisors).toEqual([]);
  });

  it('places each person under their own office and department', () => {
    const president = person({ position: 'president' });
    const auditor = person({ position: 'vp_audit' });
    const academicHead = person({ section: 'department', position: 'head', department: 'academic' });
    const academicVice = person({ section: 'department', position: 'vice_head', department: 'academic' });
    const eventsVice = person({ section: 'department', position: 'vice_head', department: 'events' });
    const advisor = person({ section: 'advisor', position: 'advisor' });

    const board = buildPeopleBoard([advisor, eventsVice, academicVice, academicHead, auditor, president]);

    expect(board.presidium.find((slot) => slot.position === 'president')?.people).toEqual([president]);
    expect(board.presidium.find((slot) => slot.position === 'vp_audit')?.people).toEqual([auditor]);
    const academic = board.departments.find((slot) => slot.department === 'academic');
    expect(academic?.heads).toEqual([academicHead]);
    expect(academic?.viceHeads).toEqual([academicVice]);
    const events = board.departments.find((slot) => slot.department === 'events');
    expect(events?.heads).toEqual([]);
    expect(events?.viceHeads).toEqual([eventsVice]);
    expect(board.advisors).toEqual([advisor]);
  });

  it('orders people in one office by sort order', () => {
    const second = person({ section: 'department', position: 'vice_head', department: 'technology', sortOrder: 2 });
    const first = person({ section: 'department', position: 'vice_head', department: 'technology', sortOrder: 1 });
    const board = buildPeopleBoard([second, first]);
    expect(board.departments.find((slot) => slot.department === 'technology')?.viceHeads).toEqual([first, second]);
  });
});

describe('personTitle', () => {
  it('falls back to the office title when no custom title is set', () => {
    expect(personTitle(person({ section: 'department', position: 'head', department: 'academic' }))).toBe('Head of Academic');
    expect(personTitle(person({ section: 'advisor', position: 'advisor' }))).toBe('Honorary Advisor');
  });

  it('prefers the custom title in English, as the site shows it', () => {
    expect(personTitle(person({ title: { zh: '创始主席', en: 'Founding President' } }))).toBe('Founding President');
    expect(personTitle(person({ title: { zh: '', en: 'Founding President' } }))).toBe('Founding President');
  });
});

describe('photoPlaceholder', () => {
  it('uses the English initials, as the site shows them', () => {
    expect(photoPlaceholder({ zh: '王小明', en: 'Xiaoming Wang' })).toBe('XW');
  });

  it('uses up to two English initials', () => {
    expect(photoPlaceholder({ zh: '', en: 'yihang sam wu' })).toBe('YS');
    expect(photoPlaceholder({ zh: '  ', en: 'Ada' })).toBe('A');
  });

  it('falls back to the Chinese field when no English name was written', () => {
    expect(photoPlaceholder({ zh: 'Ada Lin', en: '' })).toBe('AL');
  });

  it('shows a question mark for an empty name', () => {
    expect(photoPlaceholder(emptyText())).toBe('?');
  });
});
