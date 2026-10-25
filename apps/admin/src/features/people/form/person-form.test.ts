import { describe, expect, it } from 'vitest';
import { DEPARTMENTS, DEPARTMENT_POSITIONS, PRESIDIUM_POSITIONS, validatePersonInput, type Person } from '@msc-web/content';
import {
  emptyPersonInput,
  newPersonPath,
  personDefaultsFromQuery,
  placementFor,
  positionOptions,
  toPersonInput,
  withSection,
  type Placement,
} from './person-form';

function queryOf(path: string): URLSearchParams {
  return new URL(path, 'https://utmmsc.com/admin/').searchParams;
}

describe('newPersonPath and personDefaultsFromQuery', () => {
  const placements: Placement[] = [
    ...PRESIDIUM_POSITIONS.map((position): Placement => ({ section: 'presidium', position, department: null })),
    ...DEPARTMENTS.flatMap((department) => DEPARTMENT_POSITIONS.map((position): Placement => ({ section: 'department', position, department }))),
    { section: 'advisor', position: 'advisor', department: null },
  ];

  it('builds the add links the people list uses', () => {
    expect(newPersonPath({ section: 'presidium', position: 'vp_finance', department: null })).toBe(
      '/people/new?section=presidium&position=vp_finance',
    );
    expect(newPersonPath({ section: 'department', position: 'vice_head', department: 'academic' })).toBe(
      '/people/new?section=department&position=vice_head&department=academic',
    );
    expect(newPersonPath({ section: 'advisor', position: 'advisor', department: null })).toBe('/people/new?section=advisor');
  });

  it('opens every add link pre-set to its office', () => {
    for (const placement of placements) {
      const defaults = personDefaultsFromQuery(queryOf(newPersonPath(placement)));
      expect({ section: defaults.section, position: defaults.position, department: defaults.department }).toEqual(placement);
    }
  });

  it('turns an unknown or mismatched address into a valid placement', () => {
    expect(personDefaultsFromQuery(queryOf('/people/new'))).toMatchObject({ section: 'presidium', position: 'president', department: null });
    expect(personDefaultsFromQuery(queryOf('/people/new?section=board&position=head'))).toMatchObject({
      section: 'presidium',
      position: 'president',
    });
    expect(personDefaultsFromQuery(queryOf('/people/new?section=department&position=president&department=finance'))).toMatchObject({
      section: 'department',
      position: 'head',
      department: 'technology',
    });
    expect(personDefaultsFromQuery(queryOf('/people/new?section=advisor&position=president&department=academic'))).toMatchObject({
      section: 'advisor',
      position: 'advisor',
      department: null,
    });
  });

  it('starts a new entry visible with empty text', () => {
    const defaults = personDefaultsFromQuery(queryOf('/people/new?section=advisor'));
    expect(defaults.visible).toBe(true);
    expect(defaults.name).toEqual({ zh: '', en: '' });
    expect(defaults.photoKey).toBeNull();
  });
});

describe('withSection', () => {
  const head = emptyPersonInput({ section: 'department', position: 'vice_head', department: 'publicity' });

  it('clears the department and picks an office when moving to the Presidium', () => {
    expect(withSection(head, 'presidium')).toMatchObject({ section: 'presidium', position: 'president', department: null });
  });

  it('gives advisors the advisor position and no department', () => {
    expect(withSection(head, 'advisor')).toMatchObject({ section: 'advisor', position: 'advisor', department: null });
  });

  it('keeps a position and department that still fit', () => {
    expect(withSection(head, 'department')).toMatchObject({ position: 'vice_head', department: 'publicity' });
  });

  it('always yields a placement the shared validator accepts', () => {
    const named = { ...head, name: { zh: '李四', en: '' } };
    for (const section of ['presidium', 'department', 'advisor'] as const) {
      expect(validatePersonInput(withSection(named, section)).ok).toBe(true);
    }
  });

  it('keeps the rest of the form untouched', () => {
    const edited = { ...head, name: { zh: '李四', en: 'Si Li' }, sortOrder: 3, visible: false };
    expect(withSection(edited, 'advisor')).toMatchObject({ name: { zh: '李四', en: 'Si Li' }, sortOrder: 3, visible: false });
  });
});

describe('positionOptions', () => {
  it('offers the offices of each section in constitution order', () => {
    expect(positionOptions('presidium').map((option) => option.label)).toEqual(['主席', '秘书长', '财务副主席', '监督审计副主席']);
    expect(positionOptions('department').map((option) => option.label)).toEqual(['部长', '副部长']);
    expect(positionOptions('advisor')).toEqual([]);
  });

  it('agrees with placementFor', () => {
    for (const section of ['presidium', 'department', 'advisor'] as const) {
      const placement = placementFor(section, undefined, undefined);
      const values = positionOptions(section).map((option) => option.value);
      if (values.length > 0) expect(values).toContain(placement.position);
    }
  });
});

describe('toPersonInput', () => {
  it('sends only editable fields, in a shape the shared validator accepts unchanged', () => {
    const person: Person = {
      ...emptyPersonInput({ section: 'department', position: 'head', department: 'academic' }),
      id: 'per_1',
      name: { zh: '王五', en: 'Wu Wang' },
      email: 'wu@example.com',
      linkUrl: 'https://example.com',
      sortOrder: 4,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-02T00:00:00.000Z',
    };
    const input = toPersonInput(person);
    expect(input).not.toHaveProperty('id');
    expect(input).not.toHaveProperty('updatedAt');
    const result = validatePersonInput(input);
    expect(result).toEqual({ ok: true, value: input });
  });
});
