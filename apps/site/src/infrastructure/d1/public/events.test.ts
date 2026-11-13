import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSqliteD1, sqlite, type SqliteD1 } from '../testing/sqlite-d1';
import { createMemoryBucket } from '../../r2/testing/memory-bucket';
import {
  countPastInterestClasses,
  findPublishedEvent,
  listPastEvents,
  listPastInterestClasses,
  listPublishedEventLinks,
  listUpcomingEvents,
  listUpcomingInterestClasses,
} from './events';
import { TEST_NOW, seedEvent, seedEventPhoto, seedMedia } from './testing/seed';

const PHOTO_A = 'img/2026/0123456789abcdef0123456789abcdef.jpg';
const PHOTO_B = 'img/2026/fedcba9876543210fedcba9876543210.jpg';

describe.skipIf(!sqlite)('public event queries', () => {
  let d1: SqliteD1;

  beforeEach(() => {
    d1 = createSqliteD1();
  });

  afterEach(() => d1.close());

  function slugs(events: { slug: string }[]): string[] {
    return events.map((event) => event.slug);
  }

  it('lists events that have not ended, ongoing ones included, earliest first', async () => {
    seedEvent(d1, { slug: 'later', startsAt: '2026-11-20T18:00' });
    seedEvent(d1, { slug: 'ongoing', startsAt: '2026-10-25T10:00', endsAt: '2026-10-25T14:00' });
    seedEvent(d1, { slug: 'soon', startsAt: '2026-10-30T18:00', endsAt: '2026-10-30T20:00' });
    seedEvent(d1, { slug: 'today-no-end', startsAt: '2026-10-25T09:00' });
    seedEvent(d1, { slug: 'ended-this-morning', startsAt: '2026-10-25T08:00', endsAt: '2026-10-25T11:59' });
    seedEvent(d1, { slug: 'draft', startsAt: '2026-11-01T18:00', status: 'draft' });

    expect(slugs(await listUpcomingEvents(d1.db, TEST_NOW))).toEqual(['today-no-end', 'ongoing', 'soon', 'later']);
    expect(slugs(await listUpcomingEvents(d1.db, TEST_NOW, { limit: 2 }))).toEqual(['today-no-end', 'ongoing']);
  });

  it('counts an event marked as ended as past, whatever its date', async () => {
    seedEvent(d1, { slug: 'next-week', startsAt: '2026-11-01T18:00' });
    seedEvent(d1, { slug: 'called-off', startsAt: '2026-11-08T18:00' });
    d1.exec("UPDATE events SET archived = 1 WHERE slug = 'called-off'");

    expect(slugs(await listUpcomingEvents(d1.db, TEST_NOW))).toEqual(['next-week']);
    const past = await listPastEvents(d1.db, TEST_NOW, { category: null, page: 1, pageSize: 12 });
    expect(slugs(past.events)).toEqual(['called-off']);
    expect(past.total).toBe(1);
    expect(past.events[0]?.archived).toBe(true);
  });

  it('pages through ended events newest first and counts them all', async () => {
    for (let day = 1; day <= 14; day += 1) {
      seedEvent(d1, { slug: `past-${day}`, startsAt: `2026-09-${String(day).padStart(2, '0')}T18:00`, endsAt: `2026-09-${String(day).padStart(2, '0')}T20:00` });
    }
    seedEvent(d1, { slug: 'yesterday-no-end', startsAt: '2026-10-24T18:00' });
    seedEvent(d1, { slug: 'past-draft', startsAt: '2026-10-01T18:00', status: 'draft' });
    seedEvent(d1, { slug: 'upcoming', startsAt: '2026-11-01T18:00' });

    const first = await listPastEvents(d1.db, TEST_NOW, { category: null, page: 1, pageSize: 12 });
    expect(first.total).toBe(15);
    expect(first.events).toHaveLength(12);
    expect(slugs(first.events).slice(0, 3)).toEqual(['yesterday-no-end', 'past-14', 'past-13']);

    const second = await listPastEvents(d1.db, TEST_NOW, { category: null, page: 2, pageSize: 12 });
    expect(slugs(second.events)).toEqual(['past-3', 'past-2', 'past-1']);

    const beyond = await listPastEvents(d1.db, TEST_NOW, { category: null, page: 9, pageSize: 12 });
    expect(beyond).toEqual({ events: [], total: 15 });
  });

  it('filters both lists by category', async () => {
    seedEvent(d1, { slug: 'talk', startsAt: '2026-11-02T18:00', category: 'academic' });
    seedEvent(d1, { slug: 'party', startsAt: '2026-11-03T18:00', category: 'extracurricular' });
    seedEvent(d1, { slug: 'old-party', startsAt: '2026-09-03T18:00', category: 'extracurricular' });

    expect(slugs(await listUpcomingEvents(d1.db, TEST_NOW, { category: 'extracurricular' }))).toEqual(['party']);
    const past = await listPastEvents(d1.db, TEST_NOW, { category: 'academic', page: 1, pageSize: 12 });
    expect(past).toEqual({ events: [], total: 0 });
  });

  describe('interest classes', () => {
    /** Interest classes on both sides of now, with everything that must stay out of their lists. */
    /** 现在前后的兴趣课，以及所有不应出现在兴趣课列表中的活动。 */
    function seedInterestClasses(): void {
      seedEvent(d1, { slug: 'prices', startsAt: '2026-11-27T18:00', interestClass: true });
      seedEvent(d1, { slug: 'today-class', startsAt: '2026-10-25T10:00', endsAt: '2026-10-25T13:00', interestClass: true });
      seedEvent(d1, { slug: 'later-class', startsAt: '2026-12-04T18:00', interestClass: true });
      seedEvent(d1, { slug: 'old-class', startsAt: '2026-09-18T18:00', endsAt: '2026-09-18T19:30', interestClass: true });
      seedEvent(d1, { slug: 'chinese-text', startsAt: '2026-10-16T18:00', interestClass: true });
      seedEvent(d1, { slug: 'called-off-class', startsAt: '2026-11-13T18:00', interestClass: true, archived: true });
      seedEvent(d1, { slug: 'draft-class', startsAt: '2026-11-06T18:00', interestClass: true, status: 'draft' });
      seedEvent(d1, { slug: 'old-draft-class', startsAt: '2026-09-06T18:00', interestClass: true, status: 'draft' });
      seedEvent(d1, { slug: 'mislabelled-social', startsAt: '2026-11-20T18:00', category: 'extracurricular', interestClass: true });
      seedEvent(d1, { slug: 'old-mislabelled-social', startsAt: '2026-09-20T18:00', category: 'extracurricular', interestClass: true });
      seedEvent(d1, { slug: 'workshop', startsAt: '2026-11-08T18:00', category: 'academic' });
      seedEvent(d1, { slug: 'old-talk', startsAt: '2026-10-18T17:00', category: 'academic' });
    }

    it('lists published academic interest classes that have not ended, earliest first, and nothing else', async () => {
      seedInterestClasses();
      expect(slugs(await listUpcomingInterestClasses(d1.db, TEST_NOW))).toEqual(['today-class', 'prices', 'later-class']);
      expect(slugs(await listUpcomingInterestClasses(d1.db, TEST_NOW, { limit: 2 }))).toEqual(['today-class', 'prices']);
    });

    it('pages through ended interest classes newest first, counting one marked as ended whatever its date', async () => {
      seedInterestClasses();
      const first = await listPastInterestClasses(d1.db, TEST_NOW, { page: 1, pageSize: 2 });
      expect(slugs(first.events)).toEqual(['called-off-class', 'chinese-text']);
      expect(first.total).toBe(3);
      expect(slugs((await listPastInterestClasses(d1.db, TEST_NOW, { page: 2, pageSize: 2 })).events)).toEqual(['old-class']);
      expect(await countPastInterestClasses(d1.db, TEST_NOW)).toBe(3);
    });

    it('still lists interest classes among all events and among academic events', async () => {
      seedInterestClasses();
      expect(slugs(await listUpcomingEvents(d1.db, TEST_NOW, { category: 'academic' }))).toEqual(['today-class', 'workshop', 'prices', 'later-class']);
      expect(slugs(await listUpcomingEvents(d1.db, TEST_NOW))).toContain('prices');
      const past = await listPastEvents(d1.db, TEST_NOW, { category: 'academic', page: 1, pageSize: 12 });
      expect(slugs(past.events)).toEqual(['called-off-class', 'old-talk', 'chinese-text', 'old-class']);
    });

    it('finds none in an empty database', async () => {
      expect(await listUpcomingInterestClasses(d1.db, TEST_NOW)).toEqual([]);
      expect(await listPastInterestClasses(d1.db, TEST_NOW, { page: 1, pageSize: 12 })).toEqual({ events: [], total: 0 });
      expect(await countPastInterestClasses(d1.db, TEST_NOW)).toBe(0);
    });
  });

  it('finds a published event with its photos in order, never a draft', async () => {
    const bucket = createMemoryBucket().bucket;
    await seedMedia(d1.db, bucket, PHOTO_A);
    await seedMedia(d1.db, bucket, PHOTO_B);
    const id = seedEvent(d1, { slug: 'gala', startsAt: '2026-10-10T18:00' });
    seedEventPhoto(d1, { eventId: id, mediaKey: PHOTO_B, sortOrder: 2 });
    seedEventPhoto(d1, { eventId: id, mediaKey: PHOTO_A, sortOrder: 1, caption: { zh: '合影' } });
    seedEvent(d1, { slug: 'hidden', startsAt: '2026-10-10T18:00', status: 'draft' });

    const event = await findPublishedEvent(d1.db, 'gala');
    expect(event?.photos.map((photo) => photo.mediaKey)).toEqual([PHOTO_A, PHOTO_B]);
    expect(event?.photos[0]?.caption).toEqual({ zh: '合影', en: '' });
    expect(await findPublishedEvent(d1.db, 'hidden')).toBeNull();
    expect(await findPublishedEvent(d1.db, 'missing')).toBeNull();
  });

  it('lists published events for the sitemap with the latest of event and photo times', async () => {
    const bucket = createMemoryBucket().bucket;
    await seedMedia(d1.db, bucket, PHOTO_A);
    const id = seedEvent(d1, { slug: 'with-photo', startsAt: '2026-10-10T18:00', updatedAt: '2026-10-11T00:00:00.000Z' });
    seedEventPhoto(d1, { eventId: id, mediaKey: PHOTO_A, createdAt: '2026-10-20T00:00:00.000Z' });
    seedEvent(d1, { slug: 'plain', startsAt: '2026-10-01T18:00', updatedAt: '2026-10-02T00:00:00.000Z' });
    seedEvent(d1, { slug: 'draft', startsAt: '2026-10-05T18:00', status: 'draft' });

    expect(await listPublishedEventLinks(d1.db)).toEqual([
      { slug: 'with-photo', updatedAt: '2026-10-20T00:00:00.000Z' },
      { slug: 'plain', updatedAt: '2026-10-02T00:00:00.000Z' },
    ]);
  });
});
