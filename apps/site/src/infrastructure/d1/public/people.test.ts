import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestEnv, type TestEnv } from '../../../testing/test-env';
import { sqlite } from '../testing/sqlite-d1';
import { listVisiblePeople } from './people';

const AT = '2026-09-01T00:00:00.000Z';

describe.skipIf(!sqlite)('listVisiblePeople', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
    test.d1.exec(`
      INSERT INTO people (id, section, position, department, name_zh, name_en, sort_order, visible, created_at, updated_at) VALUES
        ('advisor', 'advisor', 'advisor', NULL, '顾问', 'Advisor', 0, 1, '${AT}', '${AT}'),
        ('vice-b', 'department', 'vice_head', 'academic', '乙', 'Vice B', 2, 1, '${AT}', '${AT}'),
        ('vice-a', 'department', 'vice_head', 'academic', '甲', 'Vice A', 1, 1, '${AT}', '${AT}'),
        ('head-academic', 'department', 'head', 'academic', '学术', 'Academic Head', 0, 1, '${AT}', '${AT}'),
        ('head-technology', 'department', 'head', 'technology', '科技', 'Technology Head', 0, 1, '${AT}', '${AT}'),
        ('audit', 'presidium', 'vp_audit', NULL, '审计', 'Audit', 0, 1, '${AT}', '${AT}'),
        ('president', 'presidium', 'president', NULL, '主席', 'President', 0, 1, '${AT}', '${AT}'),
        ('hidden', 'presidium', 'secretary_general', NULL, '隐藏', 'Hidden', 0, 0, '${AT}', '${AT}');
    `);
  });

  afterEach(() => test.close());

  it('returns only visible people, in constitution order', async () => {
    const people = await listVisiblePeople(test.d1.db);
    expect(people.map((person) => person.id)).toEqual(['president', 'audit', 'head-technology', 'head-academic', 'vice-a', 'vice-b', 'advisor']);
    expect(people[0]?.name).toEqual({ zh: '主席', en: 'President' });
  });

  it('limits the list to one section', async () => {
    const people = await listVisiblePeople(test.d1.db, 'presidium');
    expect(people.map((person) => person.id)).toEqual(['president', 'audit']);
  });

  it('returns nothing from an empty table', async () => {
    test.d1.exec('DELETE FROM people');
    expect(await listVisiblePeople(test.d1.db)).toEqual([]);
  });
});
