import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSqliteD1, sqlite, type SqliteD1 } from '../testing/sqlite-d1';
import { createMemoryBucket } from '../../r2/testing/memory-bucket';
import { findVisibleCourse, listCourseSessions, listPublishedTerms, listReviewedCourseLinks, listReviewedCourses, listTermCourseReviews } from './reviews';
import { seedCourse, seedMaterial, seedMedia, seedSession } from './testing/seed';

const SLIDES = 'doc/2026/0123456789abcdef0123456789abcdef.pdf';

describe.skipIf(!sqlite)('public review queries', () => {
  let d1: SqliteD1;

  beforeEach(() => {
    d1 = createSqliteD1();
  });

  afterEach(() => d1.close());

  it('lists terms with published sessions of visible courses, newest first', async () => {
    const visible = seedCourse(d1, { code: 'CSC108H5' });
    const hidden = seedCourse(d1, { code: 'MAT135H5', visible: false });
    seedSession(d1, { courseId: visible, term: '2026-winter' });
    seedSession(d1, { courseId: visible, term: '2025-fall' });
    seedSession(d1, { courseId: visible, term: '2026-summer' });
    seedSession(d1, { courseId: visible, term: '2026-winter', exam: 'final' });
    seedSession(d1, { courseId: visible, term: '2027-winter', status: 'draft' });
    seedSession(d1, { courseId: hidden, term: '2026-fall' });

    expect(await listPublishedTerms(d1.db)).toEqual(['2026-summer', '2026-winter', '2025-fall']);
  });

  it('lists the courses of a term with their published sessions and materials in order', async () => {
    await seedMedia(d1.db, createMemoryBucket().bucket, SLIDES);
    const mat = seedCourse(d1, { code: 'MAT135H5', sortOrder: 1 });
    const csc = seedCourse(d1, { code: 'CSC108H5', sortOrder: 1 });
    const bio = seedCourse(d1, { code: 'BIO152H5', sortOrder: 2 });
    const hidden = seedCourse(d1, { code: 'ECO101H5', visible: false });
    const final = seedSession(d1, { courseId: csc, term: '2026-fall', exam: 'final', startsAt: '2026-12-01T18:00' });
    const undated = seedSession(d1, { courseId: csc, term: '2026-fall', exam: 'midterm' });
    const dated = seedSession(d1, { courseId: csc, term: '2026-fall', exam: 'midterm', startsAt: '2026-10-20T18:00' });
    seedSession(d1, { courseId: csc, term: '2026-fall', status: 'draft' });
    seedSession(d1, { courseId: csc, term: '2026-winter' });
    seedSession(d1, { courseId: mat, term: '2026-fall' });
    seedSession(d1, { courseId: bio, term: '2026-winter' });
    seedSession(d1, { courseId: hidden, term: '2026-fall' });
    seedMaterial(d1, { sessionId: dated, url: 'https://example.com/practice', kind: 'practice', sortOrder: 2 });
    seedMaterial(d1, { sessionId: dated, mediaKey: SLIDES, sortOrder: 1 });

    const reviews = await listTermCourseReviews(d1.db, '2026-fall');
    expect(reviews.map((entry) => entry.course.code)).toEqual(['CSC108H5', 'MAT135H5']);
    const csc108 = reviews[0];
    expect(csc108?.sessions.map((session) => session.id)).toEqual([dated, undated, final]);
    expect(csc108?.sessions[0]?.materials.map((material) => material.mediaKey ?? material.url)).toEqual([SLIDES, 'https://example.com/practice']);
    expect(csc108?.sessions[1]?.materials).toEqual([]);
    expect(await listTermCourseReviews(d1.db, '2024-fall')).toEqual([]);
  });

  it('lists every visible course that has a published session', async () => {
    seedSession(d1, { courseId: seedCourse(d1, { code: 'MAT135H5', sortOrder: 2 }), term: '2025-fall' });
    seedSession(d1, { courseId: seedCourse(d1, { code: 'CSC108H5', sortOrder: 1 }), term: '2026-fall' });
    seedSession(d1, { courseId: seedCourse(d1, { code: 'BIO152H5' }), term: '2026-fall', status: 'draft' });
    seedSession(d1, { courseId: seedCourse(d1, { code: 'ECO101H5', visible: false }), term: '2026-fall' });
    seedCourse(d1, { code: 'PSY100H5' });

    expect((await listReviewedCourses(d1.db)).map((course) => course.code)).toEqual(['CSC108H5', 'MAT135H5']);
  });

  it('finds only visible courses and their published sessions across terms', async () => {
    const csc = seedCourse(d1, { code: 'CSC108H5' });
    seedCourse(d1, { code: 'ECO101H5', visible: false });
    const winter = seedSession(d1, { courseId: csc, term: '2026-winter' });
    const fall = seedSession(d1, { courseId: csc, term: '2026-fall' });
    seedSession(d1, { courseId: csc, term: '2026-fall', status: 'draft' });

    expect((await findVisibleCourse(d1.db, 'CSC108H5'))?.id).toBe(csc);
    expect(await findVisibleCourse(d1.db, 'ECO101H5')).toBeNull();
    expect((await listCourseSessions(d1.db, csc)).map((session) => session.id).sort()).toEqual([winter, fall].sort());
  });

  it('dates each course page by the latest change to the course or its published sessions', async () => {
    const csc = seedCourse(d1, { code: 'CSC108H5', updatedAt: '2026-09-01T00:00:00.000Z' });
    seedSession(d1, { courseId: csc, term: '2026-fall', updatedAt: '2026-10-01T00:00:00.000Z' });
    seedSession(d1, { courseId: csc, term: '2026-fall', status: 'draft', updatedAt: '2026-10-20T00:00:00.000Z' });
    const mat = seedCourse(d1, { code: 'MAT135H5', sortOrder: 1, updatedAt: '2026-10-15T00:00:00.000Z' });
    seedSession(d1, { courseId: mat, term: '2026-fall', updatedAt: '2026-10-02T00:00:00.000Z' });
    seedCourse(d1, { code: 'PSY100H5' });

    expect(await listReviewedCourseLinks(d1.db)).toEqual([
      { code: 'CSC108H5', updatedAt: '2026-10-01T00:00:00.000Z' },
      { code: 'MAT135H5', updatedAt: '2026-10-15T00:00:00.000Z' },
    ]);
  });
});
