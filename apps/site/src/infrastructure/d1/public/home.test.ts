import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl } from '@msc-web/content';
import { createTestEnv, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../media';
import { sqlite } from '../testing/sqlite-d1';
import { countHomeStats, listHighlightPhotos } from './home';

const AT = '2026-09-01T00:00:00.000Z';
const PHOTO_KEY = 'img/2026/0123456789abcdef0123456789abcdef.jpg';

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

  it('lists the newest photos of published events only, up to the limit', async () => {
    seedEvents();
    await insertMedia(
      test.d1.db,
      {
        key: PHOTO_KEY,
        url: mediaUrl(PHOTO_KEY),
        kind: 'image',
        contentType: 'image/jpeg',
        size: 4,
        width: 1600,
        height: 1200,
        fileName: 'photo.jpg',
        createdAt: AT,
      },
      'mem_president',
    );
    await test.media.bucket.put(PHOTO_KEY, new Uint8Array([255, 216, 255, 224]));
    test.d1.exec(`
      INSERT INTO event_photos (id, event_id, media_key, sort_order, created_at) VALUES
        ('pho-old', 'evt-talk', '${PHOTO_KEY}', 0, '2026-10-11T00:00:00.000Z'),
        ('pho-new', 'evt-social', '${PHOTO_KEY}', 0, '2026-11-11T00:00:00.000Z'),
        ('pho-draft', 'evt-draft', '${PHOTO_KEY}', 0, '2026-12-11T00:00:00.000Z');
    `);

    const photos = await listHighlightPhotos(test.d1.db, 6);
    expect(photos).toEqual([
      { mediaKey: PHOTO_KEY, eventSlug: '2026-11-social', eventTitle: { zh: '联谊', en: 'Social' } },
      { mediaKey: PHOTO_KEY, eventSlug: '2026-10-talk', eventTitle: { zh: '讲座', en: 'Talk' } },
    ]);
    expect((await listHighlightPhotos(test.d1.db, 1)).map((photo) => photo.eventSlug)).toEqual(['2026-11-social']);
  });
});
