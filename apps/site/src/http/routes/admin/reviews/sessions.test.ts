import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  mediaUrl,
  type ApiErrorBody,
  type CourseResponse,
  type MediaRecord,
  type ReviewMaterial,
  type ReviewMaterialResponse,
  type ReviewSessionDetail,
  type ReviewSessionResponse,
} from '@msc-web/content';
import { app } from '../../../app';
import { TEST_TOKENS, asOfficer, createTestEnv, removingMediaBeforeWrite, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { MAX_MATERIALS_PER_SESSION } from '../../../../infrastructure/d1/review-materials';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const PDF_BYTES = new TextEncoder().encode('%PDF-1.7');

const IMAGE_KEY = 'img/2026/0123456789abcdef0123456789abcdef.jpg';

function documentKey(index: number): string {
  return `doc/2026/${index.toString(16).padStart(32, '0')}.pdf`;
}

function documentRecord(key: string): MediaRecord {
  return {
    key,
    url: mediaUrl(key),
    kind: 'document',
    contentType: 'application/pdf',
    size: PDF_BYTES.length,
    width: null,
    height: null,
    fileName: 'review.pdf',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function courseBody(code: string) {
  return { code, title: { zh: '计算机科学导论', en: '' }, description: { zh: '', en: '' }, sortOrder: 0, visible: true };
}

function sessionBody(overrides: Record<string, unknown> = {}) {
  return {
    term: '2026-winter',
    exam: 'midterm',
    status: 'published',
    title: { zh: '第 1-5 章', en: 'Chapters 1-5' },
    startsAt: '2026-02-20T18:00',
    endsAt: '2026-02-20T20:00',
    mode: 'in_person',
    location: { zh: 'DV 2074', en: 'DV 2074' },
    presenters: '张三',
    registrationUrl: null,
    recordingUrl: null,
    notes: { zh: '', en: '' },
    ...overrides,
  };
}

function materialBody(overrides: Record<string, unknown> = {}) {
  return { kind: 'slides', label: { zh: '课件', en: 'Slides' }, mediaKey: null, url: null, sortOrder: 0, ...overrides };
}

const sessionPath = (sessionId: string) => `/admin/api/review-sessions/${sessionId}`;
const materialsPath = (sessionId: string) => `${sessionPath(sessionId)}/materials`;
const materialPath = (sessionId: string, materialId: string) => `${materialsPath(sessionId)}/${materialId}`;

describe.skipIf(!sqlite)('review session admin API', () => {
  let test: TestEnv;
  let session: ReviewSessionDetail;

  async function send(method: string, path: string, body?: unknown, env = test.env) {
    const ctx = testExecutionContext();
    const response = await app.request(path, asOfficer(TEST_TOKENS.academic, body, method), env, ctx);
    await ctx.settle();
    return response;
  }

  async function createSession(code = 'CSC108H5'): Promise<ReviewSessionDetail> {
    const { course } = (await (await send('POST', '/admin/api/courses', courseBody(code))).json()) as CourseResponse;
    const response = await send('POST', `/admin/api/courses/${course.id}/sessions`, sessionBody());
    return ((await response.json()) as ReviewSessionResponse).session;
  }

  async function addMaterial(sessionId: string, overrides: Record<string, unknown>): Promise<ReviewMaterial> {
    const response = await send('POST', materialsPath(sessionId), materialBody(overrides));
    expect(response.status).toBe(201);
    return ((await response.json()) as ReviewMaterialResponse).material;
  }

  async function seedDocument(key: string) {
    await insertMedia(test.env.DB, documentRecord(key), 'mem_academic');
    await test.media.bucket.put(key, PDF_BYTES);
  }

  function isStored(key: string): boolean {
    return test.media.objects.has(key) && test.d1.rows('SELECT key FROM media WHERE key = ?', key).length === 1;
  }

  function changeLog() {
    return test.d1.rows<{ action: string; entity: string; summary: string }>('SELECT action, entity, summary FROM change_log ORDER BY rowid');
  }

  async function issuesOf(response: Response) {
    return ((await response.json()) as ApiErrorBody).error.issues;
  }

  beforeEach(async () => {
    test = createTestEnv();
    session = await createSession();
  });

  afterEach(() => test.close());

  describe('sessions', () => {
    it('answers a session with its materials', async () => {
      const material = await addMaterial(session.id, { url: 'https://example.com/folder' });
      const response = await send('GET', sessionPath(session.id));
      expect(response.status).toBe(200);
      const body = (await response.json()) as ReviewSessionResponse;
      expect(body.session).toMatchObject({ id: session.id, exam: 'midterm', title: { zh: '第 1-5 章', en: 'Chapters 1-5' } });
      expect(body.session.materials).toEqual([material]);
      expect((await send('GET', sessionPath('rvs_missing'))).status).toBe(404);
    });

    it('saves over the loaded version and refuses a stale or missing one', async () => {
      await addMaterial(session.id, { url: 'https://example.com/folder' });
      const changed = sessionBody({ exam: 'final', status: 'draft' });
      const saved = await send('PUT', sessionPath(session.id), { value: changed, expectedUpdatedAt: session.updatedAt });
      expect(saved.status).toBe(200);
      const body = (await saved.json()) as ReviewSessionResponse;
      expect(body.session).toMatchObject({ exam: 'final', status: 'draft' });
      expect(body.session.updatedAt > session.updatedAt).toBe(true);
      expect(body.session.materials).toHaveLength(1);

      const late = await send('PUT', sessionPath(session.id), { value: sessionBody(), expectedUpdatedAt: session.updatedAt });
      expect(late.status).toBe(409);
      expect(((await late.json()) as ApiErrorBody).error.code).toBe('stale');
      const missing = await send('PUT', sessionPath('rvs_missing'), { value: sessionBody(), expectedUpdatedAt: session.updatedAt });
      expect(missing.status).toBe(404);
      expect(changeLog().filter((entry) => entry.entity === 'review_session')).toEqual([
        { action: 'create', entity: 'review_session', summary: 'CSC108H5 期中复习' },
        { action: 'update', entity: 'review_session', summary: 'CSC108H5 期末复习' },
      ]);
    });

    it('reports every issue of an invalid session', async () => {
      const response = await send('PUT', sessionPath(session.id), {
        value: sessionBody({ term: '2026-spring', startsAt: null, endsAt: '2026-02-20T20:00' }),
        expectedUpdatedAt: session.updatedAt,
      });
      expect(response.status).toBe(400);
      expect((await issuesOf(response))?.map((issue) => issue.field)).toEqual(['term', 'startsAt']);
    });

    it('deletes a session with its materials and releases their files', async () => {
      await seedDocument(documentKey(1));
      await addMaterial(session.id, { mediaKey: documentKey(1) });
      await addMaterial(session.id, { url: 'https://example.com/folder' });

      expect((await send('DELETE', sessionPath(session.id))).status).toBe(204);
      expect((await send('GET', sessionPath(session.id))).status).toBe(404);
      expect(test.d1.rows('SELECT id FROM review_materials')).toEqual([]);
      expect(isStored(documentKey(1))).toBe(false);
      expect(test.media.objects.size).toBe(0);
      expect(changeLog().at(-1)).toEqual({ action: 'delete', entity: 'review_session', summary: 'CSC108H5 期中复习' });
      expect((await send('DELETE', sessionPath(session.id))).status).toBe(404);
    });
  });

  describe('materials', () => {
    it('adds a file or a link and names the material after its session', async () => {
      await seedDocument(documentKey(1));
      const file = await addMaterial(session.id, { mediaKey: documentKey(1) });
      expect(file).toMatchObject({ sessionId: session.id, kind: 'slides', mediaKey: documentKey(1), url: null });
      expect(file.id).toMatch(/^mat_[0-9a-f]{32}$/);
      const link = await addMaterial(session.id, { kind: 'practice', label: { zh: '', en: '' }, url: 'https://example.com/practice' });
      expect(link).toMatchObject({ mediaKey: null, url: 'https://example.com/practice' });
      expect(changeLog().filter((entry) => entry.entity === 'review_material').map((entry) => entry.summary)).toEqual([
        'CSC108H5 期中复习 · 课件',
        'CSC108H5 期中复习 · 练习题',
      ]);
    });

    it('logs a material with only an English label under that label', async () => {
      await addMaterial(session.id, { label: { zh: '', en: 'Week 3 slides' }, url: 'https://example.com/week-3' });
      expect(changeLog().at(-1)).toEqual({ action: 'create', entity: 'review_material', summary: 'CSC108H5 期中复习 · Week 3 slides' });
    });

    it('reports a file removed between the check and the write on the file field', async () => {
      await seedDocument(documentKey(1));
      const response = await send('POST', materialsPath(session.id), materialBody({ mediaKey: documentKey(1) }), removingMediaBeforeWrite(test, documentKey(1)));
      expect(response.status).toBe(400);
      expect(await issuesOf(response)).toEqual([{ field: 'mediaKey', message: '文件不存在，请重新上传' }]);
      expect(test.d1.rows('SELECT id FROM review_materials')).toEqual([]);
    });

    it('accepts only an uploaded document as the material file', async () => {
      const missing = await send('POST', materialsPath(session.id), materialBody({ mediaKey: documentKey(9) }));
      expect(missing.status).toBe(400);
      expect(await issuesOf(missing)).toEqual([{ field: 'mediaKey', message: '文件不存在，请重新上传' }]);

      const image = await send('POST', materialsPath(session.id), materialBody({ mediaKey: IMAGE_KEY }));
      expect(image.status).toBe(400);
      expect((await issuesOf(image))?.[0]?.field).toBe('mediaKey');

      await seedDocument(documentKey(1));
      const both = await send('POST', materialsPath(session.id), materialBody({ mediaKey: documentKey(1), url: 'https://example.com/a' }));
      expect(both.status).toBe(400);
      expect(test.d1.rows('SELECT id FROM review_materials')).toEqual([]);
    });

    it(`refuses more than ${MAX_MATERIALS_PER_SESSION} materials in one session`, async () => {
      const insert = test.d1.raw.prepare(
        'INSERT INTO review_materials (id, session_id, kind, url, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      );
      for (let index = 0; index < MAX_MATERIALS_PER_SESSION - 1; index += 1) {
        insert.run(`mat_${index}`, session.id, 'other', 'https://example.com/material', index, '2026-01-01T00:00:00.000Z');
      }
      await addMaterial(session.id, { url: 'https://example.com/last' });

      const response = await send('POST', materialsPath(session.id), materialBody({ url: 'https://example.com/one-more' }));
      expect(response.status).toBe(400);
      expect(((await response.json()) as ApiErrorBody).error.code).toBe('too_many_materials');
    });

    it('refuses a material under a session that does not exist', async () => {
      const response = await send('POST', materialsPath('rvs_missing'), materialBody({ url: 'https://example.com/a' }));
      expect(response.status).toBe(404);
    });

    it('releases a file that an edit replaces and keeps the new one', async () => {
      await seedDocument(documentKey(1));
      await seedDocument(documentKey(2));
      const material = await addMaterial(session.id, { mediaKey: documentKey(1) });
      const path = materialPath(session.id, material.id);

      const replaced = await send('PUT', path, materialBody({ mediaKey: documentKey(2), sortOrder: 4 }));
      expect(replaced.status).toBe(200);
      expect(((await replaced.json()) as ReviewMaterialResponse).material).toMatchObject({ id: material.id, mediaKey: documentKey(2), sortOrder: 4 });
      expect(isStored(documentKey(1))).toBe(false);
      expect(isStored(documentKey(2))).toBe(true);

      const relabelled = await send('PUT', path, materialBody({ mediaKey: documentKey(2), label: { zh: '新课件', en: '' } }));
      expect(relabelled.status).toBe(200);
      expect(isStored(documentKey(2))).toBe(true);

      const linked = await send('PUT', path, materialBody({ url: 'https://example.com/folder' }));
      expect(linked.status).toBe(200);
      expect(isStored(documentKey(2))).toBe(false);
    });

    it('edits and deletes a material only through its own session', async () => {
      await seedDocument(documentKey(1));
      const material = await addMaterial(session.id, { mediaKey: documentKey(1) });
      const other = await createSession('MAT135H5');
      const link = materialBody({ url: 'https://example.com/a' });

      expect((await send('PUT', materialPath(other.id, material.id), link)).status).toBe(404);
      expect((await send('DELETE', materialPath(other.id, material.id))).status).toBe(404);
      expect((await send('PUT', materialPath(session.id, 'mat_missing'), link)).status).toBe(404);
      expect(isStored(documentKey(1))).toBe(true);

      expect((await send('DELETE', materialPath(session.id, material.id))).status).toBe(204);
      expect(test.d1.rows('SELECT id FROM review_materials')).toEqual([]);
      expect(isStored(documentKey(1))).toBe(false);
      expect(changeLog().at(-1)).toEqual({ action: 'delete', entity: 'review_material', summary: 'CSC108H5 期中复习 · 课件' });
    });

    it('keeps a file that another material still uses', async () => {
      await seedDocument(documentKey(1));
      const first = await addMaterial(session.id, { mediaKey: documentKey(1) });
      await addMaterial(session.id, { mediaKey: documentKey(1), kind: 'notes' });

      expect((await send('DELETE', materialPath(session.id, first.id))).status).toBe(204);
      expect(isStored(documentKey(1))).toBe(true);
    });
  });
});
