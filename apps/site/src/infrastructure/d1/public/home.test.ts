import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestEnv, type TestEnv } from '../../../testing/test-env';
import { sqlite } from '../testing/sqlite-d1';
import { countHomeStats } from './home';

const AT = '2026-09-01T00:00:00.000Z';

describe.skipIf(!sqlite)('home page queries', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  function seedEvents() {
    test.d1.exec(`
      INSERT INTO events (id, slug, category, status, title_zh, title_en, starts_at, created_at, updated_at) VALUES
        ('evt-talk', '2026-10-talk', 'academic', 'published', '讲座', 'Talk', '2026-10-10T18:00', '${AT}', '${AT}'),
        ('evt-social', '2026-11-social', 'extracurricular', 'published', '联谊', 'Social', '2026-11-10T18:00', '${AT}', '${AT}'),
        ('evt-draft', '2026-12-draft', 'academic', 'draft', '草稿', 'Draft', '2026-12-10T18:00', '${AT}', '${AT}');
    `);
  }

  it('counts published sessions and courses of visible courses, and published events', async () => {
    seedEvents();
    test.d1.exec(`
      INSERT INTO courses (id, code, title_zh, title_en, visible, created_at, updated_at) VALUES
        ('crs-csc', 'CSC108H5', '计算机', 'Computer Science', 1, '${AT}', '${AT}'),
        ('crs-mat', 'MAT135H5', '微积分', 'Calculus', 1, '${AT}', '${AT}'),
        ('crs-hidden', 'ECO100Y5', '经济', 'Economics', 0, '${AT}', '${AT}');
      INSERT INTO review_sessions (id, course_id, term, exam, status, mode, created_at, updated_at) VALUES
        ('ses-1', 'crs-csc', '2026-fall', 'midterm', 'published', 'in_person', '${AT}', '${AT}'),
        ('ses-2', 'crs-csc', '2026-fall', 'final', 'published', 'online', '${AT}', '${AT}'),
        ('ses-3', 'crs-csc', '2026-fall', 'final', 'draft', 'online', '${AT}', '${AT}'),
        ('ses-4', 'crs-mat', '2026-winter', 'midterm', 'published', 'in_person', '${AT}', '${AT}'),
        ('ses-5', 'crs-hidden', '2026-fall', 'midterm', 'published', 'in_person', '${AT}', '${AT}');
    `);
    expect(await countHomeStats(test.d1.db)).toEqual({ reviewSessions: 3, events: 2, coursesWithReviews: 2 });
  });

  it('counts nothing on an empty site', async () => {
    expect(await countHomeStats(test.d1.db)).toEqual({ reviewSessions: 0, events: 0, coursesWithReviews: 0 });
  });
});
