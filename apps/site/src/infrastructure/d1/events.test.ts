import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl, type AdminIdentity, type EventInput, type MediaRecord } from '@msc-web/content';
import { deleteEventPhoto, findEventPhoto, insertEventPhoto, listEventPhotos, updateEventPhoto } from './event-photos';
import { deleteEvent, findEvent, findEventDetail, insertEvent, listEventSlugsStartingWith, listEvents, updateEvent } from './events';
import { insertMedia } from './media';
import { createSqliteD1, sqlite, type SqliteD1 } from './testing/sqlite-d1';

const OFFICER: AdminIdentity = {
  memberId: 'mem_events',
  displayName: '测试活动部长',
  role: 'head_events',
  roleLabel: { zh: '活动部部长', en: 'Head of Events' },
  permissions: ['events.edit'],
  source: 'member',
};

const IMAGE_KEY = 'img/2026/0123456789abcdef0123456789abcdef.jpg';

function eventInput(overrides: Partial<EventInput> = {}): EventInput {
  return {
    slug: '2026-10-mid-autumn-night',
    category: 'extracurricular',
    status: 'published',
    title: { zh: '中秋晚会', en: 'Mid-Autumn Night' },
    summary: { zh: '', en: '' },
    body: { zh: '', en: '' },
    startsAt: '2026-10-03T18:30',
    endsAt: null,
    location: { zh: '', en: '' },
    coverKey: null,
    registrationUrl: null,
    archived: false,
    ...overrides,
  };
}

/** A fresh database holding one uploaded image, IMAGE_KEY. */
/** 一个全新的数据库，其中已有一张上传的图片 IMAGE_KEY。 */
async function databaseWithImage(): Promise<SqliteD1> {
  const d1 = createSqliteD1();
  const image: MediaRecord = {
    key: IMAGE_KEY,
    url: mediaUrl(IMAGE_KEY),
    kind: 'image',
    contentType: 'image/jpeg',
    size: 3,
    width: 1,
    height: 1,
    fileName: 'a.jpg',
    createdAt: '2026-10-01T00:00:00.000Z',
  };
  await insertMedia(d1.db, image, OFFICER.memberId);
  return d1;
}

describe.skipIf(!sqlite)('events repository', () => {
  let d1: SqliteD1;

  beforeEach(async () => {
    d1 = await databaseWithImage();
  });

  afterEach(() => d1.close());

  it('lists events latest first and filters by category and status', async () => {
    await insertEvent(d1.db, OFFICER, eventInput({ slug: 'talk', category: 'academic', status: 'published', startsAt: '2026-09-10T18:00' }));
    await insertEvent(d1.db, OFFICER, eventInput({ slug: 'gala', category: 'extracurricular', status: 'published', startsAt: '2026-10-03T18:30' }));
    await insertEvent(d1.db, OFFICER, eventInput({ slug: 'draft-talk', category: 'academic', status: 'draft', startsAt: '2026-11-01T12:00' }));

    expect((await listEvents(d1.db)).map((event) => event.slug)).toEqual(['draft-talk', 'gala', 'talk']);
    expect((await listEvents(d1.db, { category: 'academic' })).map((event) => event.slug)).toEqual(['draft-talk', 'talk']);
    expect((await listEvents(d1.db, { category: 'academic', status: 'published' })).map((event) => event.slug)).toEqual(['talk']);
  });

  it('finds slugs by prefix and matches wildcard characters literally', async () => {
    await insertEvent(d1.db, OFFICER, eventInput({ slug: '2026-10-gala' }));
    await insertEvent(d1.db, OFFICER, eventInput({ slug: '2026-10-gala-2' }));
    await insertEvent(d1.db, OFFICER, eventInput({ slug: '2026-09-gala' }));

    expect((await listEventSlugsStartingWith(d1.db, '2026-10-gala')).sort()).toEqual(['2026-10-gala', '2026-10-gala-2']);
    expect(await listEventSlugsStartingWith(d1.db, '2026_10%')).toEqual([]);
    expect(await listEventSlugsStartingWith(d1.db, '2026-10-GALA')).toEqual([]);
  });

  it('finds slugs by a prefix longer than the 50 bytes D1 allows in a LIKE pattern', async () => {
    const stem = '2026-11-research-writing-workshop-for-first-year-students';
    await insertEvent(d1.db, OFFICER, eventInput({ slug: stem }));
    await insertEvent(d1.db, OFFICER, eventInput({ slug: `${stem}-2` }));
    await insertEvent(d1.db, OFFICER, eventInput({ slug: '2026-11-research' }));

    expect((await listEventSlugsStartingWith(d1.db, stem)).sort()).toEqual([stem, `${stem}-2`]);
  });

  it('records each save in the change log under the Chinese title, falling back to English', async () => {
    const event = await insertEvent(d1.db, OFFICER, eventInput({ title: { zh: '', en: 'Board Games' } }));
    await updateEvent(d1.db, OFFICER, event.id, eventInput({ title: { zh: '桌游之夜', en: 'Board Games' } }), event.updatedAt);

    expect(d1.rows('SELECT action, entity, entity_id, summary, member_name FROM change_log ORDER BY at, rowid')).toEqual([
      { action: 'create', entity: 'event', entity_id: event.id, summary: 'Board Games', member_name: '测试活动部长' },
      { action: 'update', entity: 'event', entity_id: event.id, summary: '桌游之夜', member_name: '测试活动部长' },
    ]);
  });

  it('updates only the version it was given and tells stale from missing', async () => {
    const event = await insertEvent(d1.db, OFFICER, eventInput());

    expect(await updateEvent(d1.db, OFFICER, event.id, eventInput({ coverKey: IMAGE_KEY }), event.updatedAt)).toBe('updated');
    const saved = await findEvent(d1.db, event.id);
    expect(saved?.coverKey).toBe(IMAGE_KEY);
    expect(saved && saved.updatedAt > event.updatedAt).toBe(true);

    expect(await updateEvent(d1.db, OFFICER, event.id, eventInput(), event.updatedAt)).toBe('stale');
    expect(await updateEvent(d1.db, OFFICER, 'evt_missing', eventInput(), event.updatedAt)).toBe('missing');
    expect((await findEvent(d1.db, event.id))?.coverKey).toBe(IMAGE_KEY);
  });

  it('removes the gallery together with the event', async () => {
    const event = await insertEvent(d1.db, OFFICER, eventInput());
    await insertEventPhoto(d1.db, OFFICER, event, { mediaKey: IMAGE_KEY, caption: { zh: '', en: '' }, sortOrder: 0 });

    expect(await deleteEvent(d1.db, OFFICER, event)).toBe(true);
    expect(await findEventDetail(d1.db, event.id)).toBeNull();
    expect(d1.rows('SELECT id FROM event_photos')).toEqual([]);
    expect(await deleteEvent(d1.db, OFFICER, event)).toBe(false);
  });
});

describe.skipIf(!sqlite)('event photos repository', () => {
  let d1: SqliteD1;

  beforeEach(async () => {
    d1 = await databaseWithImage();
  });

  afterEach(() => d1.close());

  it('orders a gallery by sort order, then by upload time', async () => {
    const event = await insertEvent(d1.db, OFFICER, eventInput());
    const insert = d1.raw.prepare(
      'INSERT INTO event_photos (id, event_id, media_key, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
    );
    insert.run('pho_late', event.id, IMAGE_KEY, 1, '2026-10-05T00:00:00.000Z');
    insert.run('pho_first', event.id, IMAGE_KEY, 0, '2026-10-06T00:00:00.000Z');
    insert.run('pho_early', event.id, IMAGE_KEY, 1, '2026-10-04T00:00:00.000Z');

    expect((await listEventPhotos(d1.db, event.id)).map((photo) => photo.id)).toEqual(['pho_first', 'pho_early', 'pho_late']);
    expect((await findEventDetail(d1.db, event.id))?.photos).toHaveLength(3);
  });

  it('finds, updates and deletes a photo only through the event it belongs to', async () => {
    const event = await insertEvent(d1.db, OFFICER, eventInput());
    const other = await insertEvent(d1.db, OFFICER, eventInput({ slug: 'other' }));
    const photo = await insertEventPhoto(d1.db, OFFICER, event, { mediaKey: IMAGE_KEY, caption: { zh: '合影', en: '' }, sortOrder: 2 });

    expect(await findEventPhoto(d1.db, other.id, photo.id)).toBeNull();
    expect(await findEventPhoto(d1.db, event.id, photo.id)).toEqual(photo);
    expect(await updateEventPhoto(d1.db, OFFICER, other, photo, { caption: { zh: '', en: '' }, sortOrder: 0 })).toBeNull();
    expect(await deleteEventPhoto(d1.db, OFFICER, other, photo)).toBe(false);

    const saved = await updateEventPhoto(d1.db, OFFICER, event, photo, { caption: { zh: '全体合影', en: 'Group photo' }, sortOrder: 5 });
    expect(saved).toEqual({ ...photo, caption: { zh: '全体合影', en: 'Group photo' }, sortOrder: 5 });
    expect(await findEventPhoto(d1.db, event.id, photo.id)).toEqual(saved);
    expect(await deleteEventPhoto(d1.db, OFFICER, event, photo)).toBe(true);
    expect(await listEventPhotos(d1.db, event.id)).toEqual([]);
  });

  it('leaves the event version alone and logs gallery changes under the event title', async () => {
    const event = await insertEvent(d1.db, OFFICER, eventInput());
    const photo = await insertEventPhoto(d1.db, OFFICER, event, { mediaKey: IMAGE_KEY, caption: { zh: '', en: '' }, sortOrder: 0 });
    await updateEventPhoto(d1.db, OFFICER, event, photo, { caption: { zh: '舞台', en: '' }, sortOrder: 1 });
    await deleteEventPhoto(d1.db, OFFICER, event, photo);

    expect((await findEvent(d1.db, event.id))?.updatedAt).toBe(event.updatedAt);
    expect(d1.rows("SELECT action, summary FROM change_log WHERE entity = 'event_photo' ORDER BY at, rowid")).toEqual([
      { action: 'create', summary: '中秋晚会' },
      { action: 'update', summary: '中秋晚会' },
      { action: 'delete', summary: '中秋晚会' },
    ]);
  });
});
