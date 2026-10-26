import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl, type Course, type MediaRecord, type ReviewMaterialInput, type ReviewSession, type ReviewSessionInput } from '@msc-web/content';
import { DEVELOPER_IDENTITY } from '../../domain/access/identity';
import { createCourse } from './courses';
import { insertMedia } from './media';
import { createMaterial, type MaterialSession } from './review-materials';
import {
  compareSessions,
  createSession,
  deleteSession,
  findSessionDetail,
  findSessionReference,
  listSessionDetailsOfCourse,
  sessionSummary,
  updateSession,
} from './review-sessions';
import { createSqliteD1, sqlite, type SqliteD1 } from './testing/sqlite-d1';

function sessionInput(overrides: Partial<ReviewSessionInput> = {}): ReviewSessionInput {
  return {
    term: '2026-winter',
    exam: 'midterm',
    status: 'published',
    title: { zh: '', en: '' },
    startsAt: '2026-02-20T18:00',
    endsAt: null,
    mode: 'in_person',
    location: { zh: '', en: '' },
    presenters: '',
    registrationUrl: null,
    recordingUrl: null,
    notes: { zh: '', en: '' },
    ...overrides,
  };
}

function session(id: string, overrides: Partial<ReviewSessionInput> = {}): ReviewSession {
  return { id, courseId: 'crs_1', ...sessionInput(overrides), createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
}

describe('compareSessions', () => {
  it('puts the newest term first, then earlier starts, unscheduled sessions last, and midterms before finals', () => {
    const sessions = [
      session('fall-2025', { term: '2025-fall', startsAt: '2025-10-01T18:00' }),
      session('unscheduled', { startsAt: null }),
      session('final-same-time', { exam: 'final', startsAt: '2026-02-20T18:00' }),
      session('later', { exam: 'final', startsAt: '2026-04-10T18:00' }),
      session('midterm-same-time', { startsAt: '2026-02-20T18:00' }),
      session('summer-2026', { term: '2026-summer', startsAt: '2026-06-01T18:00' }),
    ];
    expect(sessions.sort(compareSessions).map((item) => item.id)).toEqual([
      'summer-2026',
      'midterm-same-time',
      'final-same-time',
      'later',
      'unscheduled',
      'fall-2025',
    ]);
  });
});

const FILE_KEY = 'doc/2026/0123456789abcdef0123456789abcdef.pdf';

const FILE_RECORD: MediaRecord = {
  key: FILE_KEY,
  url: mediaUrl(FILE_KEY),
  kind: 'document',
  contentType: 'application/pdf',
  size: 8,
  width: null,
  height: null,
  fileName: 'notes.pdf',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe.skipIf(!sqlite)('review session repository', () => {
  let d1: SqliteD1;
  let course: Course;

  beforeEach(async () => {
    d1 = createSqliteD1();
    course = await createCourse(d1.db, DEVELOPER_IDENTITY, {
      code: 'CSC108H5',
      title: { zh: '计算机科学导论', en: '' },
      description: { zh: '', en: '' },
      sortOrder: 0,
      visible: true,
      archived: false,
    });
  });

  afterEach(() => d1.close());

  function changeLog() {
    return d1.rows<{ action: string; entity: string; summary: string }>(
      'SELECT action, entity, summary FROM change_log WHERE entity != ? ORDER BY rowid',
      'course',
    );
  }

  function insertMaterialRow(id: string, sessionId: string, sortOrder: number, createdAt: string) {
    d1.raw
      .prepare('INSERT INTO review_materials (id, session_id, kind, url, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, sessionId, 'other', 'https://example.com/material', sortOrder, createdAt);
  }

  it('names a session by course code and exam in the change log', async () => {
    const created = await createSession(d1.db, DEVELOPER_IDENTITY, course, sessionInput());
    await updateSession(d1.db, DEVELOPER_IDENTITY, created.id, sessionInput({ exam: 'final' }), created.updatedAt);
    expect(changeLog()).toEqual([
      { action: 'create', entity: 'review_session', summary: 'CSC108H5 期中复习' },
      { action: 'update', entity: 'review_session', summary: 'CSC108H5 期末复习' },
    ]);
  });

  it('lists a course with sessions in order and materials by sort order then creation, reading materials once', async () => {
    const older = await createSession(d1.db, DEVELOPER_IDENTITY, course, sessionInput({ term: '2025-fall', startsAt: '2025-10-01T18:00' }));
    const newer = await createSession(d1.db, DEVELOPER_IDENTITY, course, sessionInput({ term: '2026-winter' }));
    insertMaterialRow('mat_b', newer.id, 1, '2026-01-02T00:00:00.000Z');
    insertMaterialRow('mat_c', newer.id, 0, '2026-01-03T00:00:00.000Z');
    insertMaterialRow('mat_a', newer.id, 1, '2026-01-01T00:00:00.000Z');
    insertMaterialRow('mat_old', older.id, 0, '2025-09-01T00:00:00.000Z');

    const before = d1.statements.length;
    const sessions = await listSessionDetailsOfCourse(d1.db, course.id);
    expect(d1.statements.slice(before).filter((statement) => statement.sql.includes('FROM review_materials'))).toHaveLength(1);
    expect(sessions.map((item) => [item.id, item.materials.map((material) => material.id)])).toEqual([
      [newer.id, ['mat_c', 'mat_a', 'mat_b']],
      [older.id, ['mat_old']],
    ]);
    expect((await findSessionDetail(d1.db, newer.id))?.materials.map((material) => material.id)).toEqual(['mat_c', 'mat_a', 'mat_b']);
    expect(await findSessionDetail(d1.db, 'rvs_missing')).toBeNull();
  });

  it('saves only over the version the editor loaded and logs only saves that happened', async () => {
    const created = await createSession(d1.db, DEVELOPER_IDENTITY, course, sessionInput());
    const saved = await updateSession(d1.db, DEVELOPER_IDENTITY, created.id, sessionInput({ status: 'draft' }), created.updatedAt);
    expect(saved.outcome).toBe('updated');
    if (saved.outcome !== 'updated') return;
    expect(saved.session.status).toBe('draft');
    expect(saved.session.updatedAt > created.updatedAt).toBe(true);
    expect((await findSessionReference(d1.db, created.id))?.updatedAt).toBe(saved.session.updatedAt);

    expect((await updateSession(d1.db, DEVELOPER_IDENTITY, created.id, sessionInput(), created.updatedAt)).outcome).toBe('stale');
    expect((await updateSession(d1.db, DEVELOPER_IDENTITY, 'rvs_missing', sessionInput(), created.updatedAt)).outcome).toBe('missing');
    expect(changeLog().map((entry) => entry.action)).toEqual(['create', 'update']);
  });

  it('deletes a session with its materials and returns only the uploaded files', async () => {
    await insertMedia(d1.db, FILE_RECORD, 'developer');
    const created = await createSession(d1.db, DEVELOPER_IDENTITY, course, sessionInput());
    const named: MaterialSession = { id: created.id, summary: sessionSummary({ courseCode: course.code, exam: created.exam }) };
    const material: ReviewMaterialInput = { kind: 'notes', label: { zh: '', en: '' }, mediaKey: FILE_KEY, url: null, sortOrder: 0 };
    await createMaterial(d1.db, DEVELOPER_IDENTITY, named, material);
    await createMaterial(d1.db, DEVELOPER_IDENTITY, named, { ...material, kind: 'other', mediaKey: null, url: 'https://example.com/folder' });

    expect(await deleteSession(d1.db, DEVELOPER_IDENTITY, created.id)).toEqual([FILE_KEY]);
    expect(d1.rows('SELECT id FROM review_materials')).toEqual([]);
    expect(changeLog().at(-1)).toEqual({ action: 'delete', entity: 'review_session', summary: 'CSC108H5 期中复习' });
    expect(await deleteSession(d1.db, DEVELOPER_IDENTITY, created.id)).toBeNull();
  });
});
