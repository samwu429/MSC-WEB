import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  mediaUrl,
  type ApiErrorBody,
  type CourseResponse,
  type CoursesResponse,
  type MediaRecord,
  type ReviewMaterialResponse,
  type ReviewSessionResponse,
} from '@msc-web/content';
import { app } from '../../../app';
import { TEST_TOKENS, asOfficer, changingBeforeWrite, createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const PDF_BYTES = new TextEncoder().encode('%PDF-1.7');

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

function courseBody(overrides: Record<string, unknown> = {}) {
  return {
    code: 'CSC108H5',
    title: { zh: '计算机科学导论', en: 'Introduction to Computer Science' },
    description: { zh: '', en: '' },
    sortOrder: 0,
    visible: true,
    ...overrides,
  };
}

function sessionBody(overrides: Record<string, unknown> = {}) {
  return {
    term: '2026-winter',
    exam: 'midterm',
    status: 'published',
    title: { zh: '', en: '' },
    startsAt: '2026-02-20T18:00',
    endsAt: null,
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
  return { kind: 'slides', label: { zh: '', en: '' }, mediaKey: null, url: null, sortOrder: 0, ...overrides };
}

const coursePath = (courseId: string) => `/admin/api/courses/${courseId}`;

describe.skipIf(!sqlite)('course admin API', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  async function send(method: string, path: string, body?: unknown, token: string = TEST_TOKENS.academic, env = test.env) {
    const ctx = testExecutionContext();
    const response = await app.request(path, asOfficer(token, body, method), env, ctx);
    await ctx.settle();
    return response;
  }

  async function createCourse(overrides: Record<string, unknown> = {}) {
    const response = await send('POST', '/admin/api/courses', courseBody(overrides));
    expect(response.status).toBe(201);
    return ((await response.json()) as CourseResponse).course;
  }

  async function addSession(courseId: string, overrides: Record<string, unknown> = {}) {
    const response = await send('POST', `${coursePath(courseId)}/sessions`, sessionBody(overrides));
    expect(response.status).toBe(201);
    return ((await response.json()) as ReviewSessionResponse).session;
  }

  async function addMaterial(sessionId: string, overrides: Record<string, unknown>) {
    const response = await send('POST', `/admin/api/review-sessions/${sessionId}/materials`, materialBody(overrides));
    expect(response.status).toBe(201);
    return ((await response.json()) as ReviewMaterialResponse).material;
  }

  async function seedDocument(key: string) {
    await insertMedia(test.env.DB, documentRecord(key), 'mem_academic');
    await test.media.bucket.put(key, PDF_BYTES);
  }

  function changeLog() {
    return test.d1.rows<{ action: string; entity: string; summary: string; member_id: string }>(
      'SELECT action, entity, summary, member_id FROM change_log ORDER BY rowid',
    );
  }

  it('lists courses by sort order then code with their session counts', async () => {
    const csc = await createCourse({ code: 'CSC108H5', sortOrder: 1 });
    await createCourse({ code: 'MAT135H5', sortOrder: 0 });
    await createCourse({ code: 'BIO152H5', sortOrder: 1 });
    await addSession(csc.id, { status: 'published' });
    await addSession(csc.id, { status: 'draft', exam: 'final' });

    const response = await send('GET', '/admin/api/courses');
    expect(response.status).toBe(200);
    const { courses } = (await response.json()) as CoursesResponse;
    expect(courses.map((course) => [course.code, course.sessionCount, course.publishedSessionCount])).toEqual([
      ['MAT135H5', 0, 0],
      ['BIO152H5', 0, 0],
      ['CSC108H5', 2, 1],
    ]);
  });

  it('creates a course under its normalised code and records who did it', async () => {
    const response = await send('POST', '/admin/api/courses', courseBody({ code: 'csc 108h5' }));
    expect(response.status).toBe(201);
    const body = (await response.json()) as CourseResponse;
    expect(body.course.code).toBe('CSC108H5');
    expect(body.course.id).toMatch(/^crs_[0-9a-f]{32}$/);
    expect(body.sessions).toEqual([]);
    expect(changeLog()).toEqual([{ action: 'create', entity: 'course', summary: '计算机科学导论', member_id: 'mem_academic' }]);
  });

  it('reports every issue of an invalid course', async () => {
    const response = await send('POST', '/admin/api/courses', { code: 'computer science', title: { zh: '', en: '' } });
    expect(response.status).toBe(400);
    const { error } = (await response.json()) as ApiErrorBody;
    expect(error.issues?.map((issue) => issue.field)).toEqual(['code', 'title.zh']);
  });

  it('reports a code another save took between the check and the write on the code field', async () => {
    const racing = changingBeforeWrite(test, () =>
      test.d1.exec(`INSERT OR IGNORE INTO courses (id, code, created_at, updated_at)
        VALUES ('crs_racer', 'CSC108H5', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`),
    );
    const response = await send('POST', '/admin/api/courses', courseBody({ code: 'CSC108H5' }), TEST_TOKENS.academic, racing);
    expect(response.status).toBe(400);
    expect(((await response.json()) as ApiErrorBody).error.issues).toEqual([{ field: 'code', message: '该课程代码已存在' }]);
    expect(test.d1.rows('SELECT id FROM courses')).toEqual([{ id: 'crs_racer' }]);
  });

  it('reports a course code already in use on the code field', async () => {
    const csc = await createCourse({ code: 'CSC108H5' });
    const mat = await createCourse({ code: 'MAT135H5' });

    const duplicate = await send('POST', '/admin/api/courses', courseBody({ code: 'csc108h5' }));
    expect(duplicate.status).toBe(400);
    expect(((await duplicate.json()) as ApiErrorBody).error.issues).toEqual([{ field: 'code', message: '该课程代码已存在' }]);

    const renamed = await send('PUT', coursePath(mat.id), { value: courseBody({ code: 'CSC108H5' }), expectedUpdatedAt: mat.updatedAt });
    expect(renamed.status).toBe(400);
    expect(((await renamed.json()) as ApiErrorBody).error.issues?.[0]?.field).toBe('code');

    const kept = await send('PUT', coursePath(csc.id), { value: courseBody({ sortOrder: 3 }), expectedUpdatedAt: csc.updatedAt });
    expect(kept.status).toBe(200);
  });

  it('answers a course with sessions newest term first and materials in sort order', async () => {
    await seedDocument(documentKey(1));
    const course = await createCourse();
    const fall = await addSession(course.id, { term: '2025-fall', startsAt: '2025-10-01T18:00' });
    const unscheduled = await addSession(course.id, { startsAt: null });
    const finalReview = await addSession(course.id, { exam: 'final', startsAt: '2026-04-10T18:00' });
    const finalSameTime = await addSession(course.id, { exam: 'final', startsAt: '2026-02-20T18:00' });
    const midterm = await addSession(course.id, { exam: 'midterm', startsAt: '2026-02-20T18:00' });
    const second = await addMaterial(midterm.id, { kind: 'practice', url: 'https://example.com/practice', sortOrder: 2 });
    const first = await addMaterial(midterm.id, { kind: 'slides', mediaKey: documentKey(1), sortOrder: 1 });

    const response = await send('GET', coursePath(course.id));
    expect(response.status).toBe(200);
    const body = (await response.json()) as CourseResponse;
    expect(body.course.id).toBe(course.id);
    expect(body.sessions.map((session) => session.id)).toEqual([midterm.id, finalSameTime.id, finalReview.id, unscheduled.id, fall.id]);
    expect(body.sessions[0]?.materials.map((material) => material.id)).toEqual([first.id, second.id]);
    expect(body.sessions[1]?.materials).toEqual([]);
  });

  it('answers 404 for a course that does not exist', async () => {
    expect((await send('GET', coursePath('crs_missing'))).status).toBe(404);
    expect((await send('DELETE', coursePath('crs_missing'))).status).toBe(404);
  });

  it('saves over the loaded version and refuses a stale or missing one', async () => {
    const course = await createCourse();
    await addSession(course.id);

    const saved = await send('PUT', coursePath(course.id), { value: courseBody({ visible: false }), expectedUpdatedAt: course.updatedAt });
    expect(saved.status).toBe(200);
    const body = (await saved.json()) as CourseResponse;
    expect(body.course.visible).toBe(false);
    expect(body.course.updatedAt > course.updatedAt).toBe(true);
    expect(body.sessions).toHaveLength(1);

    const late = await send('PUT', coursePath(course.id), { value: courseBody({ sortOrder: 5 }), expectedUpdatedAt: course.updatedAt });
    expect(late.status).toBe(409);
    expect(((await late.json()) as ApiErrorBody).error.code).toBe('stale');

    const missing = await send('PUT', coursePath('crs_missing'), { value: courseBody({ code: 'MAT135H5' }), expectedUpdatedAt: course.updatedAt });
    expect(missing.status).toBe(404);

    const unversioned = await send('PUT', coursePath(course.id), { value: courseBody() });
    expect(unversioned.status).toBe(400);
    expect(changeLog().filter((entry) => entry.entity === 'course').map((entry) => entry.action)).toEqual(['create', 'update']);
  });

  it('deletes a course with its sessions and materials and releases files no other record uses', async () => {
    await seedDocument(documentKey(1));
    await seedDocument(documentKey(2));
    await seedDocument(documentKey(3));
    const course = await createCourse();
    const midterm = await addSession(course.id);
    const finalReview = await addSession(course.id, { exam: 'final' });
    await addMaterial(midterm.id, { mediaKey: documentKey(1) });
    await addMaterial(midterm.id, { kind: 'other', url: 'https://example.com/folder' });
    await addMaterial(finalReview.id, { mediaKey: documentKey(2) });
    await addMaterial(finalReview.id, { mediaKey: documentKey(3) });
    const other = await createCourse({ code: 'MAT135H5' });
    const otherSession = await addSession(other.id);
    await addMaterial(otherSession.id, { mediaKey: documentKey(3) });

    const response = await send('DELETE', coursePath(course.id));
    expect(response.status).toBe(204);
    expect((await send('GET', coursePath(course.id))).status).toBe(404);
    expect(test.d1.rows('SELECT id FROM review_sessions WHERE course_id = ?', course.id)).toEqual([]);
    expect(test.d1.rows<{ session_id: string }>('SELECT session_id FROM review_materials')).toEqual([{ session_id: otherSession.id }]);
    expect([...test.media.objects.keys()]).toEqual([documentKey(3)]);
    expect(test.d1.rows<{ key: string }>('SELECT key FROM media')).toEqual([{ key: documentKey(3) }]);
    expect(changeLog().at(-1)).toMatchObject({ action: 'delete', entity: 'course', summary: '计算机科学导论' });
  });

  it('adds a session under a course and names it by course code and exam', async () => {
    const course = await createCourse();
    const session = await addSession(course.id, { exam: 'midterm' });
    expect(session.id).toMatch(/^rvs_[0-9a-f]{32}$/);
    expect(session.courseId).toBe(course.id);
    expect(session.materials).toEqual([]);
    expect(changeLog().at(-1)).toMatchObject({ action: 'create', entity: 'review_session', summary: 'CSC108H5 期中复习' });
  });

  it('refuses a session under a course that does not exist', async () => {
    const response = await send('POST', `${coursePath('crs_missing')}/sessions`, sessionBody());
    expect(response.status).toBe(404);
    expect(test.d1.rows('SELECT id FROM review_sessions')).toEqual([]);
  });

  it('keeps officers without the reviews permission out', async () => {
    expect((await send('GET', '/admin/api/courses', undefined, TEST_TOKENS.events)).status).toBe(403);
    expect((await send('POST', '/admin/api/courses', courseBody(), TEST_TOKENS.finance)).status).toBe(403);
  });
});
