import { describe, expect, it } from 'vitest';
import { comparePeople, personDisplayTitle, personInitials, validatePersonInput, type Person } from './person';
import { defaultPositionTitle } from './positions';

const base = {
  name: { zh: '张三', en: 'San Zhang' },
  title: { zh: '', en: '' },
  affiliation: { zh: '', en: '' },
  bio: { zh: '', en: '' },
  photoKey: null,
  email: null,
  linkUrl: null,
  sortOrder: 0,
  visible: true,
};

describe('validatePersonInput', () => {
  it('accepts a department head', () => {
    const result = validatePersonInput({ ...base, section: 'department', position: 'head', department: 'academic' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.department).toBe('academic');
  });

  it('requires a department for department positions', () => {
    const result = validatePersonInput({ ...base, section: 'department', position: 'head' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.field)).toContain('department');
  });

  it('refuses a department position in the Presidium', () => {
    const result = validatePersonInput({ ...base, section: 'presidium', position: 'head' });
    expect(result.ok).toBe(false);
  });

  it('clears the department outside the department section', () => {
    const result = validatePersonInput({ ...base, section: 'presidium', position: 'president', department: 'academic' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.department).toBeNull();
  });

  it('keeps advisors as advisors', () => {
    expect(validatePersonInput({ ...base, section: 'advisor', position: 'president' }).ok).toBe(false);
    const result = validatePersonInput({ ...base, section: 'advisor' });
    expect(result.ok && result.value.position).toBe('advisor');
  });
});

describe('defaultPositionTitle', () => {
  it('names department offices after the department', () => {
    expect(defaultPositionTitle('head', 'academic')).toEqual({ zh: '学术部部长', en: 'Head of Academic' });
    expect(defaultPositionTitle('vice_head', 'events')).toEqual({ zh: '活动部副部长', en: 'Vice Head of Events' });
    expect(defaultPositionTitle('vp_audit', null).zh).toBe('监督审计副主席');
  });
});

describe('personDisplayTitle', () => {
  it('uses a custom title filled in either language', () => {
    const title = { zh: '', en: 'Founding President' };
    expect(personDisplayTitle({ title, position: 'president', department: null })).toBe(title);
  });

  it('falls back to the office title when the custom title is blank', () => {
    expect(personDisplayTitle({ title: { zh: ' ', en: '' }, position: 'head', department: 'academic' })).toEqual({ zh: '学术部部长', en: 'Head of Academic' });
  });
});

describe('personInitials', () => {
  it('takes the first character of a Chinese name', () => {
    expect(personInitials(' 张三 ')).toBe('张');
  });

  it('takes up to two initials of other names, upper-cased', () => {
    expect(personInitials('San Zhang')).toBe('SZ');
    expect(personInitials('ada  lin lovelace')).toBe('AL');
    expect(personInitials('Ada')).toBe('A');
  });

  it('gives an empty string for an empty name', () => {
    expect(personInitials('')).toBe('');
    expect(personInitials('   ')).toBe('');
  });
});

describe('comparePeople', () => {
  function person(overrides: Partial<Person>): Person {
    return { ...base, id: 'x', section: 'presidium', position: 'president', department: null, createdAt: '', updatedAt: '', ...overrides };
  }

  it('follows the constitution order', () => {
    const list = [
      person({ id: 'advisor', section: 'advisor', position: 'advisor' }),
      person({ id: 'vice-tech', section: 'department', position: 'vice_head', department: 'technology' }),
      person({ id: 'head-events', section: 'department', position: 'head', department: 'events' }),
      person({ id: 'audit', position: 'vp_audit' }),
      person({ id: 'head-tech', section: 'department', position: 'head', department: 'technology' }),
      person({ id: 'president', position: 'president' }),
    ];
    expect(list.sort(comparePeople).map((entry) => entry.id)).toEqual(['president', 'audit', 'head-tech', 'vice-tech', 'head-events', 'advisor']);
  });
});
