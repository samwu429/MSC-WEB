import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl, type ApiErrorBody, type PeopleResponse, type Person, type PersonInput, type PersonResponse } from '@msc-web/content';
import { app } from '../../../app';
import { TEST_TOKENS, asOfficer, changingBeforeWrite, createTestEnv, removingMediaBeforeWrite, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const PHOTO_A = 'img/2026/0123456789abcdef0123456789abcdef.jpg';
const PHOTO_B = 'img/2026/fedcba9876543210fedcba9876543210.jpg';

function personBody(overrides: Partial<PersonInput> = {}): PersonInput {
  return {
    section: 'presidium',
    position: 'president',
    department: null,
    name: { zh: '王小明', en: 'Xiaoming Wang' },
    title: { zh: '', en: '' },
    affiliation: { zh: '计算机科学专业三年级', en: 'Computer Science, Year 3' },
    bio: { zh: '负责统筹联盟运作。', en: '' },
    photoKey: null,
    email: null,
    linkUrl: null,
    sortOrder: 0,
    visible: true,
    ...overrides,
  };
}

const VICE_HEAD: Partial<PersonInput> = { section: 'department', position: 'vice_head', department: 'academic' };
const ACADEMIC_HEAD: Partial<PersonInput> = { section: 'department', position: 'head', department: 'academic' };
const ADVISOR: Partial<PersonInput> = { section: 'advisor', position: 'advisor' };

describe.skipIf(!sqlite)('admin people API', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  async function send(path: string, init: RequestInit, env = test.env): Promise<Response> {
    const ctx = testExecutionContext();
    const response = await app.request(`/admin/api/people${path}`, init, env, ctx);
    await ctx.settle();
    return response;
  }

  function create(body: unknown): Promise<Response> {
    return send('', asOfficer(TEST_TOKENS.president, body));
  }

  function update(id: string, value: unknown, expectedUpdatedAt: string): Promise<Response> {
    return send(`/${id}`, asOfficer(TEST_TOKENS.president, { value, expectedUpdatedAt }, 'PUT'));
  }

  async function created(overrides: Partial<PersonInput> = {}): Promise<Person> {
    const response = await create(personBody(overrides));
    expect(response.status).toBe(201);
    return ((await response.json()) as PersonResponse).person;
  }

  async function errorOf(response: Response): Promise<ApiErrorBody['error']> {
    return ((await response.json()) as ApiErrorBody).error;
  }

  async function seedPhoto(key: string): Promise<void> {
    await insertMedia(
      test.env.DB,
      { key, url: mediaUrl(key), kind: 'image', contentType: 'image/jpeg', size: 3, width: 1, height: 1, fileName: 'photo.jpg', createdAt: '2026-01-01T00:00:00.000Z' },
      'mem_president',
    );
    await test.media.bucket.put(key, new Uint8Array([1, 2, 3]));
  }

  function photoStored(key: string): boolean {
    return test.media.objects.has(key) && test.d1.rows('SELECT key FROM media WHERE key = ?', key).length === 1;
  }

  it('creates people and lists everyone, hidden people included, in constitution order', async () => {
    const advisor = await created({ ...ADVISOR, name: { zh: '', en: 'Ada Lovelace' } });
    const vice = await created({ ...VICE_HEAD, visible: false });
    const president = await created();
    expect(president.id).toMatch(/^per_/);
    expect(president.affiliation.en).toBe('Computer Science, Year 3');

    const response = await send('', asOfficer(TEST_TOKENS.president));
    expect(response.status).toBe(200);
    const { people } = (await response.json()) as PeopleResponse;
    expect(people.map((person) => person.id)).toEqual([president.id, vice.id, advisor.id]);
    expect(people[1]?.visible).toBe(false);

    const one = await send(`/${president.id}`, asOfficer(TEST_TOKENS.president));
    expect(((await one.json()) as PersonResponse).person).toEqual(president);
  });

  it('records who created the person in the change log', async () => {
    const person = await created();
    expect(test.d1.rows('SELECT action, entity, entity_id, summary, member_name FROM change_log')).toEqual([
      { action: 'create', entity: 'person', entity_id: person.id, summary: '王小明', member_name: '测试主席' },
    ]);
  });

  it('saves from the loaded version and refuses a stale one', async () => {
    const person = await created();
    const saved = await update(person.id, personBody({ name: { zh: '李华', en: 'Hua Li' } }), person.updatedAt);
    expect(saved.status).toBe(200);
    const next = ((await saved.json()) as PersonResponse).person;
    expect(next.name.zh).toBe('李华');
    expect(next.updatedAt > person.updatedAt).toBe(true);

    const late = await update(person.id, personBody({ name: { zh: '张三', en: 'San Zhang' } }), person.updatedAt);
    expect(late.status).toBe(409);
    expect((await errorOf(late)).code).toBe('stale');
    const stored = ((await (await send(`/${person.id}`, asOfficer(TEST_TOKENS.president))).json()) as PersonResponse).person;
    expect(stored).toEqual(next);
    expect(test.d1.rows<{ action: string }>('SELECT action FROM change_log').map((row) => row.action)).toEqual(['create', 'update']);
  });

  it('refuses a second visible holder of a single-holder office and names the current one', async () => {
    const holder = await created();
    const second = await create(personBody({ name: { zh: '李华', en: 'Hua Li' } }));
    expect(second.status).toBe(409);
    const error = await errorOf(second);
    expect(error.code).toBe('office_taken');
    expect(error.message).toContain('主席');
    expect(error.message).toContain('王小明');

    const successor = await created({ name: { zh: '李华', en: 'Hua Li' }, visible: false });
    const shown = await update(successor.id, personBody({ name: { zh: '李华', en: 'Hua Li' }, visible: true }), successor.updatedAt);
    expect(shown.status).toBe(409);
    expect((await errorOf(shown)).code).toBe('office_taken');

    const resaved = await update(holder.id, personBody({ bio: { zh: '新的简介', en: '' } }), holder.updatedAt);
    expect(resaved.status).toBe(200);

    await created(ACADEMIC_HEAD);
    const secondHead = await create(personBody({ ...ACADEMIC_HEAD, name: { zh: '', en: 'Grace Hopper' } }));
    expect(secondHead.status).toBe(409);
    expect((await errorOf(secondHead)).message).toContain('学术部部长');
    await created({ section: 'department', position: 'head', department: 'events' });
  });

  it('answers office_taken when another save fills the office between the check and the write', async () => {
    const racing = changingBeforeWrite(test, () =>
      test.d1.exec(`INSERT OR IGNORE INTO people (id, section, position, name_zh, visible, created_at, updated_at)
        VALUES ('per_racer', 'presidium', 'president', '李华', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`),
    );
    const response = await send('', asOfficer(TEST_TOKENS.president, personBody()), racing);
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toEqual({ code: 'office_taken', message: '该职位刚刚已由其他成员担任，请刷新页面后再保存' });
    expect(test.d1.rows('SELECT id FROM people')).toEqual([{ id: 'per_racer' }]);
  });

  it('lets an office change hands once the current holder is hidden', async () => {
    const holder = await created();
    const successor = await created({ name: { zh: '李华', en: 'Hua Li' }, visible: false });
    expect((await update(holder.id, personBody({ visible: false }), holder.updatedAt)).status).toBe(200);
    expect((await update(successor.id, personBody({ name: { zh: '李华', en: 'Hua Li' } }), successor.updatedAt)).status).toBe(200);
  });

  it('allows any number of visible vice heads and advisors', async () => {
    await created(VICE_HEAD);
    await created({ ...VICE_HEAD, name: { zh: '李华', en: 'Hua Li' } });
    await created(ADVISOR);
    await created({ ...ADVISOR, name: { zh: '张三', en: 'San Zhang' } });
    const { people } = (await (await send('', asOfficer(TEST_TOKENS.president))).json()) as PeopleResponse;
    expect(people).toHaveLength(4);
  });

  it('reports every validation issue under its field', async () => {
    const response = await create({
      section: 'department',
      position: 'president',
      name: { zh: '', en: '' },
      email: 'not-an-email',
      linkUrl: 'javascript:alert(1)',
      photoKey: '../secret.jpg',
    });
    expect(response.status).toBe(400);
    const error = await errorOf(response);
    expect(error.code).toBe('invalid');
    expect(error.issues?.map((issue) => issue.field).sort()).toEqual(['department', 'email', 'linkUrl', 'name.en', 'photoKey', 'position']);
    expect(test.d1.rows('SELECT id FROM people')).toEqual([]);
  });

  it('reports a photo that was never uploaded on the photo field', async () => {
    const response = await create(personBody({ photoKey: PHOTO_A }));
    expect(response.status).toBe(400);
    expect((await errorOf(response)).issues).toEqual([{ field: 'photoKey', message: '文件不存在，请重新上传' }]);
  });

  it('reports a photo removed between the check and the write on the photo field', async () => {
    await seedPhoto(PHOTO_A);
    const response = await send('', asOfficer(TEST_TOKENS.president, personBody({ photoKey: PHOTO_A })), removingMediaBeforeWrite(test, PHOTO_A));
    expect(response.status).toBe(400);
    expect((await errorOf(response)).issues).toEqual([{ field: 'photoKey', message: '文件不存在，请重新上传' }]);
    expect(test.d1.rows('SELECT id FROM people')).toEqual([]);
  });

  it('removes a replaced photo once nothing else uses it', async () => {
    await seedPhoto(PHOTO_A);
    await seedPhoto(PHOTO_B);
    const person = await created({ photoKey: PHOTO_A });
    await created({ ...ADVISOR, photoKey: PHOTO_B });

    const replaced = await update(person.id, personBody({ photoKey: PHOTO_B }), person.updatedAt);
    expect(replaced.status).toBe(200);
    const next = ((await replaced.json()) as PersonResponse).person;
    expect(photoStored(PHOTO_A)).toBe(false);
    expect(photoStored(PHOTO_B)).toBe(true);

    expect((await update(person.id, personBody({ photoKey: null }), next.updatedAt)).status).toBe(200);
    expect(photoStored(PHOTO_B)).toBe(true);
  });

  it('deletes a person and their photo, then answers 404', async () => {
    await seedPhoto(PHOTO_A);
    const person = await created({ photoKey: PHOTO_A });

    const deleted = await send(`/${person.id}`, asOfficer(TEST_TOKENS.president, undefined, 'DELETE'));
    expect(deleted.status).toBe(204);
    expect(photoStored(PHOTO_A)).toBe(false);
    expect((await send(`/${person.id}`, asOfficer(TEST_TOKENS.president))).status).toBe(404);
    expect((await send(`/${person.id}`, asOfficer(TEST_TOKENS.president, undefined, 'DELETE'))).status).toBe(404);
    expect(test.d1.rows<{ action: string }>('SELECT action FROM change_log').map((row) => row.action)).toEqual(['create', 'delete']);
  });

  it('answers 404 when saving a person that does not exist', async () => {
    const response = await update('per_missing', personBody(), '2026-01-01T00:00:00.000Z');
    expect(response.status).toBe(404);
    expect((await errorOf(response)).code).toBe('not_found');
  });

  it('keeps officers without the people permission out', async () => {
    const refused = await send('', asOfficer(TEST_TOKENS.academic, personBody()));
    expect(refused.status).toBe(403);
    expect(test.d1.rows('SELECT id FROM people')).toEqual([]);
  });
});
