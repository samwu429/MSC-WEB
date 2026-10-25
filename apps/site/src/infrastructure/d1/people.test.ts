import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AdminIdentity, PersonInput } from '@msc-web/content';
import { createPerson, deletePerson, findPerson, findVisibleOfficeHolder, listPeople, updatePerson } from './people';
import { createSqliteD1, sqlite, type SqliteD1 } from './testing/sqlite-d1';

const EDITOR: AdminIdentity = {
  memberId: 'mem_president',
  displayName: '测试主席',
  role: 'president',
  roleLabel: { zh: '主席', en: 'President' },
  permissions: ['people.edit'],
  source: 'member',
};

function personInput(overrides: Partial<PersonInput> = {}): PersonInput {
  return {
    section: 'presidium',
    position: 'president',
    department: null,
    name: { zh: '王小明', en: 'Xiaoming Wang' },
    title: { zh: '', en: '' },
    affiliation: { zh: '数学专业三年级', en: 'Mathematics, Year 3' },
    bio: { zh: '', en: '' },
    photoKey: null,
    email: 'president@example.com',
    linkUrl: null,
    sortOrder: 0,
    visible: true,
    ...overrides,
  };
}

interface ChangeRow {
  action: string;
  entity: string;
  entity_id: string;
  summary: string;
  member_id: string;
}

describe.skipIf(!sqlite)('people repository', () => {
  let d1: SqliteD1;

  beforeEach(() => {
    d1 = createSqliteD1();
  });

  afterEach(() => d1.close());

  function changes(): ChangeRow[] {
    return d1.rows<ChangeRow>('SELECT action, entity, entity_id, summary, member_id FROM change_log ORDER BY rowid');
  }

  it('creates a person, reads it back and logs the change under the Chinese name', async () => {
    const created = await createPerson(d1.db, EDITOR, personInput());
    expect(created.id).toMatch(/^per_[0-9a-f]{32}$/);
    expect(created.createdAt).toBe(created.updatedAt);
    expect(await findPerson(d1.db, created.id)).toEqual(created);
    expect(changes()).toEqual([{ action: 'create', entity: 'person', entity_id: created.id, summary: '王小明', member_id: 'mem_president' }]);
  });

  it('logs the English name when there is no Chinese one', async () => {
    await createPerson(d1.db, EDITOR, personInput({ name: { zh: '', en: 'Ada Lovelace' } }));
    expect(changes()[0]?.summary).toBe('Ada Lovelace');
  });

  it('lists everyone, hidden people included, in constitution order', async () => {
    const advisorB = await createPerson(d1.db, EDITOR, personInput({ section: 'advisor', position: 'advisor', name: { zh: '', en: 'Beta' }, sortOrder: 2 }));
    const advisorA = await createPerson(d1.db, EDITOR, personInput({ section: 'advisor', position: 'advisor', name: { zh: '', en: 'Alpha' }, sortOrder: 2 }));
    const advisorFirst = await createPerson(d1.db, EDITOR, personInput({ section: 'advisor', position: 'advisor', name: { zh: '', en: 'Zeta' }, sortOrder: 1 }));
    const academicVice = await createPerson(d1.db, EDITOR, personInput({ section: 'department', position: 'vice_head', department: 'academic' }));
    const academicHead = await createPerson(d1.db, EDITOR, personInput({ section: 'department', position: 'head', department: 'academic', visible: false }));
    const technologyVice = await createPerson(d1.db, EDITOR, personInput({ section: 'department', position: 'vice_head', department: 'technology' }));
    const audit = await createPerson(d1.db, EDITOR, personInput({ position: 'vp_audit' }));
    const president = await createPerson(d1.db, EDITOR, personInput({ position: 'president', visible: false }));

    const people = await listPeople(d1.db);
    expect(people.map((person) => person.id)).toEqual([
      president.id,
      audit.id,
      technologyVice.id,
      academicHead.id,
      academicVice.id,
      advisorFirst.id,
      advisorA.id,
      advisorB.id,
    ]);
    expect(people.find((person) => person.id === academicHead.id)?.visible).toBe(false);
  });

  it('saves over the loaded version only, and tells a stale version from a missing person', async () => {
    const created = await createPerson(d1.db, EDITOR, personInput());
    const saved = await updatePerson(d1.db, EDITOR, created.id, personInput({ name: { zh: '李华', en: 'Hua Li' }, visible: false }), created.updatedAt);
    if (saved.outcome !== 'updated') throw new Error(`expected an update, got ${saved.outcome}`);
    expect(saved.person.name).toEqual({ zh: '李华', en: 'Hua Li' });
    expect(saved.person.visible).toBe(false);
    expect(saved.person.createdAt).toBe(created.createdAt);
    expect(saved.person.updatedAt > created.updatedAt).toBe(true);
    expect(await findPerson(d1.db, created.id)).toEqual(saved.person);
    expect(changes().map((change) => [change.action, change.summary])).toEqual([
      ['create', '王小明'],
      ['update', '李华'],
    ]);

    const again = await updatePerson(d1.db, EDITOR, created.id, personInput({ name: { zh: '张三', en: '' } }), created.updatedAt);
    expect(again).toEqual({ outcome: 'stale' });
    expect(await findPerson(d1.db, created.id)).toEqual(saved.person);

    const missing = await updatePerson(d1.db, EDITOR, 'per_missing', personInput(), created.updatedAt);
    expect(missing).toEqual({ outcome: 'missing' });
    expect(changes()).toHaveLength(2);
  });

  it('refuses a second visible holder of a one-holder office at the database, even past the route check', async () => {
    await createPerson(d1.db, EDITOR, personInput());
    await expect(createPerson(d1.db, EDITOR, personInput({ name: { zh: '第二位', en: '' } }))).rejects.toThrow(/UNIQUE constraint failed/);
    await createPerson(d1.db, EDITOR, personInput({ visible: false }));
    await createPerson(d1.db, EDITOR, personInput({ section: 'department', position: 'head', department: 'academic' }));
    await createPerson(d1.db, EDITOR, personInput({ section: 'department', position: 'head', department: 'events' }));
    await createPerson(d1.db, EDITOR, personInput({ section: 'department', position: 'vice_head', department: 'academic' }));
    await createPerson(d1.db, EDITOR, personInput({ section: 'department', position: 'vice_head', department: 'academic' }));
    await expect(createPerson(d1.db, EDITOR, personInput({ section: 'department', position: 'head', department: 'academic' }))).rejects.toThrow(
      /UNIQUE constraint failed/,
    );
    expect(changes().filter((change) => change.action === 'create')).toHaveLength(6);
  });

  it('deletes a person, returns what was deleted and logs it', async () => {
    const created = await createPerson(d1.db, EDITOR, personInput());
    expect(await deletePerson(d1.db, EDITOR, created.id)).toEqual(created);
    expect(await findPerson(d1.db, created.id)).toBeNull();
    expect(await deletePerson(d1.db, EDITOR, created.id)).toBeNull();
    expect(changes().map((change) => change.action)).toEqual(['create', 'delete']);
  });

  it('finds the visible holder of an office, ignoring hidden people and the person being saved', async () => {
    const hidden = await createPerson(d1.db, EDITOR, personInput({ visible: false }));
    expect(await findVisibleOfficeHolder(d1.db, 'president', null, null)).toBeNull();

    const holder = await createPerson(d1.db, EDITOR, personInput());
    expect((await findVisibleOfficeHolder(d1.db, 'president', null, null))?.id).toBe(holder.id);
    expect((await findVisibleOfficeHolder(d1.db, 'president', null, hidden.id))?.id).toBe(holder.id);
    expect(await findVisibleOfficeHolder(d1.db, 'president', null, holder.id)).toBeNull();

    const head = await createPerson(d1.db, EDITOR, personInput({ section: 'department', position: 'head', department: 'academic' }));
    expect((await findVisibleOfficeHolder(d1.db, 'head', 'academic', null))?.id).toBe(head.id);
    expect(await findVisibleOfficeHolder(d1.db, 'head', 'events', null)).toBeNull();
  });
});
