import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSqliteD1, sqlite, type SqliteD1 } from '../testing/sqlite-d1';
import { createMemoryBucket } from '../../r2/testing/memory-bucket';
import { findPublishedEvent, listPastEvents, listPublishedEventLinks, listUpcomingEvents } from './events';
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
