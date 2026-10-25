import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countContent } from './summary';
import { createSqliteD1, sqlite, type SqliteD1 } from './testing/sqlite-d1';

/** 16:00 UTC on 25 October 2026 is 12:00 in Toronto (daylight time). */
/** 2026 年 10 月 25 日 UTC 16:00 即多伦多时间 12:00（夏令时）。 */
const NOW = new Date('2026-10-25T16:00:00Z');

const STAMP = '2026-10-01T00:00:00.000Z';

function seed(d1: SqliteD1): void {
  d1.exec(`
    INSERT INTO people (id, section, position, visible, created_at, updated_at) VALUES
      ('per_1', 'presidium', 'president', 1, '${STAMP}', '${STAMP}'),
      ('per_2', 'presidium', 'vp_audit', 1, '${STAMP}', '${STAMP}'),
      ('per_3', 'advisor', 'advisor', 0, '${STAMP}', '${STAMP}');
    INSERT INTO events (id, slug, category, status, starts_at, created_at, updated_at) VALUES
      ('evt_now', 'now', 'academic', 'published', '2026-10-25T12:00', '${STAMP}', '${STAMP}'),
      ('evt_past', 'past', 'academic', 'published', '2026-10-25T11:59', '${STAMP}', '${STAMP}'),
      ('evt_later', 'later', 'extracurricular', 'published', '2026-12-01T18:00', '${STAMP}', '${STAMP}'),
      ('evt_draft', 'draft', 'academic', 'draft', '2027-01-01T10:00', '${STAMP}', '${STAMP}');
    INSERT INTO courses (id, code, visible, created_at, updated_at) VALUES
      ('crs_1', 'MAT135', 1, '${STAMP}', '${STAMP}'),
      ('crs_2', 'MAT136', 0, '${STAMP}', '${STAMP}');
    INSERT INTO review_sessions (id, course_id, term, exam, status, mode, created_at, updated_at) VALUES
      ('rev_1', 'crs_1', '2026-fall', 'midterm', 'published', 'in_person', '${STAMP}', '${STAMP}'),
      ('rev_2', 'crs_1', '2026-fall', 'final', 'draft', 'online', '${STAMP}', '${STAMP}'),
      ('rev_3', 'crs_2', '2026-fall', 'final', 'published', 'hybrid', '${STAMP}', '${STAMP}');
    INSERT INTO media (key, kind, content_type, size, uploaded_by, created_at) VALUES
      ('doc/2026/0123456789abcdef0123456789abcdef.pdf', 'document', 'application/pdf', 1, 'mem_x', '${STAMP}');
    INSERT INTO documents (id, category, media_key, published_on, visible, created_at, updated_at) VALUES
      ('doc_1', 'constitution', 'doc/2026/0123456789abcdef0123456789abcdef.pdf', '2026-09-01', 1, '${STAMP}', '${STAMP}'),
      ('doc_2', 'other', 'doc/2026/0123456789abcdef0123456789abcdef.pdf', '2026-09-01', 0, '${STAMP}', '${STAMP}');
  `);
}

describe.skipIf(!sqlite)('countContent', () => {
  let d1: SqliteD1;

  beforeEach(() => {
    d1 = createSqliteD1();
  });

  afterEach(() => d1.close());

  it('counts nothing on an empty site', async () => {
    expect(await countContent(d1.db, NOW)).toEqual({
      people: 0,
      eventsPublished: 0,
      eventsDraft: 0,
      upcomingEvents: 0,
      courses: 0,
      reviewSessions: 0,
      documents: 0,
    });
  });

  it('counts what the public site shows, with upcoming events from the current Toronto minute on', async () => {
    seed(d1);
    expect(await countContent(d1.db, NOW)).toEqual({
      people: 2,
      eventsPublished: 3,
      eventsDraft: 1,
      upcomingEvents: 2,
      courses: 1,
      reviewSessions: 2,
      documents: 1,
    });
  });

  it('reads everything in one statement', async () => {
    seed(d1);
    const before = d1.statements.length;
    await countContent(d1.db, NOW);
    expect(d1.statements.length - before).toBe(1);
  });
});
