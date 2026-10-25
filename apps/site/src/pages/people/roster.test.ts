import { describe, expect, it } from 'vitest';
import { DEPARTMENTS, PRESIDIUM_POSITIONS, emptyText, sectionOfPosition, type Department, type Person, type PersonPosition } from '@msc-web/content';
import { buildRoster } from './roster';

const AT = '2026-09-01T00:00:00.000Z';

function person(id: string, position: PersonPosition, department: Department | null = null): Person {
  return {
    id,
    section: sectionOfPosition(position),
    position,
    department,
    name: { zh: id, en: id },
    title: emptyText(),
    affiliation: emptyText(),
    bio: emptyText(),
    photoKey: null,
    email: null,
    linkUrl: null,
    sortOrder: 0,
    visible: true,
    createdAt: AT,
    updatedAt: AT,
  };
}

describe('buildRoster', () => {
  it('keeps every office, in constitution order, when nobody holds it', () => {
    const roster = buildRoster([]);
    expect(roster.presidium).toEqual(PRESIDIUM_POSITIONS.map((position) => ({ position, holders: [] })));
    expect(roster.departments).toEqual(DEPARTMENTS.map((department) => ({ department, heads: [], viceHeads: [] })));
    expect(roster.advisors).toEqual([]);
  });

  it('places each person by position and department, keeping the given order within a slot', () => {
    const roster = buildRoster([
      person('president', 'president'),
      person('audit', 'vp_audit'),
      person('academic-head', 'head', 'academic'),
      person('academic-vice-1', 'vice_head', 'academic'),
      person('academic-vice-2', 'vice_head', 'academic'),
      person('events-vice', 'vice_head', 'events'),
      person('advisor', 'advisor'),
    ]);
    const ids = (people: Person[]) => people.map((entry) => entry.id);

    expect(roster.presidium.map((office) => [office.position, ids(office.holders)])).toEqual([
      ['president', ['president']],
      ['secretary_general', []],
      ['vp_finance', []],
      ['vp_audit', ['audit']],
    ]);
    const academic = roster.departments.find((entry) => entry.department === 'academic');
    expect(academic && ids(academic.heads)).toEqual(['academic-head']);
    expect(academic && ids(academic.viceHeads)).toEqual(['academic-vice-1', 'academic-vice-2']);
    const events = roster.departments.find((entry) => entry.department === 'events');
    expect(events && [ids(events.heads), ids(events.viceHeads)]).toEqual([[], ['events-vice']]);
    expect(ids(roster.advisors)).toEqual(['advisor']);
  });
});
