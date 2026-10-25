import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl, type CourseInput, type MediaRecord, type ReviewMaterialInput, type ReviewSessionInput } from '@msc-web/content';
import { DEVELOPER_IDENTITY } from '../../domain/access/identity';
import { createCourse, deleteCourse, findCourse, isCourseCodeTaken, listCourseSummaries, updateCourse } from './courses';
import { insertMedia } from './media';
import { createMaterial } from './review-materials';
import { createSession, sessionSummary } from './review-sessions';
import { createSqliteD1, sqlite, type SqliteD1 } from './testing/sqlite-d1';

function courseInput(overrides: Partial<CourseInput> = {}): CourseInput {
  return {
    code: 'CSC108H5',
    title: { zh: '计算机科学导论', en: 'Introduction to Computer Science' },
    description: { zh: '', en: '' },
    sortOrder: 0,
    visible: true,
    ...overrides,
  };
}

function sessionInput(overrides: Partial<ReviewSessionInput> = {}): ReviewSessionInput {
  return {
    term: '2026-winter',
    exam: 'midterm',
    status: 'published',
    title: { zh: '', en: '' },
    startsAt: '2026-02-20T18:00',
    endsAt: '2026-02-20T20:00',
    mode: 'in_person',
    location: { zh: '', en: '' },
    presenters: '',
    registrationUrl: null,
    recordingUrl: null,
    notes: { zh: '', en: '' },
    ...overrides,
  };
}

const FILE_KEY = 'doc/2026/0123456789abcdef0123456789abcdef.pdf';

const FILE_RECORD: MediaRecord = {
  key: FILE_KEY,
  url: mediaUrl(FILE_KEY),
  kind: 'document',
  contentType: 'application/pdf',
  size: 8,
  width: null,
  height: null,
  fileName: 'slides.pdf',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe.skipIf(!sqlite)('course repository', () => {
  let d1: SqliteD1;

  beforeEach(() => {
    d1 = createSqliteD1();
  });

  afterEach(() => d1.close());

  function changeLog() {
    return d1.rows<{ action: string; entity: string; entity_id: string; summary: string }>(
      'SELECT action, entity, entity_id, summary FROM change_log ORDER BY rowid',
    );
  }

  it('lists courses by sort order then code, counting sessions in one query', async () => {
    const csc = await createCourse(d1.db, DEVELOPER_IDENTITY, courseInput({ code: 'CSC108H5', sortOrder: 1 }));
    await createCourse(d1.db, DEVELOPER_IDENTITY, courseInput({ code: 'MAT135H5', sortOrder: 0 }));
    await createCourse(d1.db, DEVELOPER_IDENTITY, courseInput({ code: 'BIO152H5', sortOrder: 1 }));
    await createSession(d1.db, DEVELOPER_IDENTITY, csc, sessionInput({ status: 'published' }));
    await createSession(d1.db, DEVELOPER_IDENTITY, csc, sessionInput({ status: 'draft', exam: 'final' }));

    const before = d1.statements.length;
    const courses = await listCourseSummaries(d1.db);
    expect(d1.statements.length - before).toBe(1);
    expect(courses.map((course) => [course.code, course.sessionCount, course.publishedSessionCount])).toEqual([
      ['MAT135H5', 0, 0],
      ['BIO152H5', 0, 0],
      ['CSC108H5', 2, 1],
    ]);
  });

  it('names a course in the change log by its Chinese title, falling back to English', async () => {
    await createCourse(d1.db, DEVELOPER_IDENTITY, courseInput({ code: 'CSC108H5' }));
    await createCourse(d1.db, DEVELOPER_IDENTITY, courseInput({ code: 'MAT135H5', title: { zh: '', en: 'Calculus I' } }));
    expect(changeLog().map((entry) => entry.summary)).toEqual(['计算机科学导论', 'Calculus I']);
  });

  it('tells a code used by another course apart from the course keeping its own code', async () => {
    const course = await createCourse(d1.db, DEVELOPER_IDENTITY, courseInput());
    expect(await isCourseCodeTaken(d1.db, 'CSC108H5', null)).toBe(true);
    expect(await isCourseCodeTaken(d1.db, 'CSC108H5', course.id)).toBe(false);
    expect(await isCourseCodeTaken(d1.db, 'MAT135H5', null)).toBe(false);
  });

  it('saves only over the version the editor loaded and logs only saves that happened', async () => {
    const course = await createCourse(d1.db, DEVELOPER_IDENTITY, courseInput());
    const saved = await updateCourse(d1.db, DEVELOPER_IDENTITY, course.id, courseInput({ visible: false }), course.updatedAt);
    expect(saved.outcome).toBe('updated');
    if (saved.outcome !== 'updated') return;
    expect(saved.course.visible).toBe(false);
    expect(saved.course.updatedAt > course.updatedAt).toBe(true);

    const late = await updateCourse(d1.db, DEVELOPER_IDENTITY, course.id, courseInput({ sortOrder: 9 }), course.updatedAt);
    expect(late.outcome).toBe('stale');
    expect((await findCourse(d1.db, course.id))?.sortOrder).toBe(0);
    expect((await updateCourse(d1.db, DEVELOPER_IDENTITY, 'crs_missing', courseInput(), course.updatedAt)).outcome).toBe('missing');
    expect(changeLog().map((entry) => entry.action)).toEqual(['create', 'update']);
  });

  it('deletes sessions and materials with the course and returns the files the materials used', async () => {
    await insertMedia(d1.db, FILE_RECORD, 'developer');
    const course = await createCourse(d1.db, DEVELOPER_IDENTITY, courseInput());
    const session = await createSession(d1.db, DEVELOPER_IDENTITY, course, sessionInput());
    const named = { id: session.id, summary: sessionSummary({ courseCode: course.code, exam: session.exam }) };
    const material: ReviewMaterialInput = { kind: 'slides', label: { zh: '', en: '' }, mediaKey: FILE_KEY, url: null, sortOrder: 0 };
    await createMaterial(d1.db, DEVELOPER_IDENTITY, named, material);
    await createMaterial(d1.db, DEVELOPER_IDENTITY, named, { ...material, kind: 'other', mediaKey: null, url: 'https://example.com/folder' });

    expect(await deleteCourse(d1.db, DEVELOPER_IDENTITY, course.id)).toEqual([FILE_KEY]);
    expect(d1.rows('SELECT id FROM review_sessions')).toEqual([]);
    expect(d1.rows('SELECT id FROM review_materials')).toEqual([]);
    expect(changeLog().at(-1)).toMatchObject({ action: 'delete', entity: 'course', entity_id: course.id, summary: '计算机科学导论' });
    expect(await deleteCourse(d1.db, DEVELOPER_IDENTITY, course.id)).toBeNull();
  });
});
