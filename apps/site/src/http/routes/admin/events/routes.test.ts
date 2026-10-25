import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  mediaUrl,
  type ApiErrorBody,
  type EventPhotoResponse,
  type EventResponse,
  type EventsResponse,
  type MediaRecord,
  type SiteEventDetail,
} from '@msc-web/content';
import { app } from '../../../app';
import { TEST_TOKENS, asOfficer, createTestEnv, removingMediaBeforeWrite, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';
import { MAX_EVENT_PHOTOS } from './photos';

describe.skipIf(!sqlite)('admin events API', () => {
  let test: TestEnv;
  let imageCount = 0;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  async function call(path: string, init: RequestInit = asOfficer(TEST_TOKENS.events), env = test.env): Promise<Response> {
    const ctx = testExecutionContext();
    const response = await app.request(`/admin/api/events${path}`, init, env, ctx);
    await ctx.settle();
    return response;
  }

  function send(method: string, body?: unknown): RequestInit {
    return asOfficer(TEST_TOKENS.events, body, method);
  }

  /** An uploaded image: a media row and the stored bytes. */
  /** 一张已上传的图片：媒体记录与存储的字节。 */
  async function uploadImage(): Promise<string> {
    imageCount += 1;
    const key = `img/2026/${imageCount.toString(16).padStart(32, '0')}.jpg`;
    const image: MediaRecord = {
      key,
      url: mediaUrl(key),
      kind: 'image',
      contentType: 'image/jpeg',
      size: 3,
      width: 1,
      height: 1,
      fileName: 'photo.jpg',
      createdAt: new Date().toISOString(),
    };
    await insertMedia(test.env.DB, image, 'mem_events');
    await test.media.bucket.put(key, new Uint8Array([1, 2, 3]));
    return key;
  }

  function isStored(key: string): boolean {
    return test.media.objects.has(key) && test.d1.rows('SELECT key FROM media WHERE key = ?', key).length === 1;
  }

  function eventBody(overrides: Record<string, unknown> = {}) {
    return {
      slug: '',
      category: 'extracurricular',
      status: 'published',
      title: { zh: '中秋晚会', en: 'Mid-Autumn Night' },
      summary: { zh: '赏月与游戏', en: '' },
      body: { zh: '', en: '' },
      startsAt: '2026-10-03T18:30',
      endsAt: '2026-10-03T21:00',
      location: { zh: '学生中心', en: 'Student Centre' },
      coverKey: null,
      registrationUrl: null,
      ...overrides,
    };
  }

  async function createEvent(overrides: Record<string, unknown> = {}): Promise<SiteEventDetail> {
    const response = await call('', send('POST', eventBody(overrides)));
    expect(response.status).toBe(201);
    return ((await response.json()) as EventResponse).event;
  }

  async function getEvent(id: string): Promise<SiteEventDetail> {
    const response = await call(`/${id}`);
    expect(response.status).toBe(200);
    return ((await response.json()) as EventResponse).event;
  }

  async function addPhoto(eventId: string, body: Record<string, unknown>): Promise<Response> {
    return call(`/${eventId}/photos`, send('POST', body));
  }

  async function errorOf(response: Response): Promise<ApiErrorBody['error']> {
    return ((await response.json()) as ApiErrorBody).error;
  }

  describe('events', () => {
    it('is closed to officers without the events permission', async () => {
      expect((await call('', asOfficer(TEST_TOKENS.finance))).status).toBe(403);
    });

    it('lists events latest first and filters by category and status', async () => {
      await createEvent({ category: 'academic', startsAt: '2026-09-10T18:00', endsAt: null, title: { zh: '讲座', en: 'Talk' } });
      await createEvent({ startsAt: '2026-10-03T18:30', endsAt: null });
      await createEvent({ category: 'academic', status: 'draft', startsAt: '2026-11-01T12:00', endsAt: null, title: { zh: '工作坊', en: 'Workshop' } });

      const all = (await (await call('')).json()) as EventsResponse;
      expect(all.events.map((event) => event.startsAt)).toEqual(['2026-11-01T12:00', '2026-10-03T18:30', '2026-09-10T18:00']);
      const academic = (await (await call('?category=academic&status=published')).json()) as EventsResponse;
      expect(academic.events.map((event) => event.title.en)).toEqual(['Talk']);
    });

    it('refuses an unknown filter value', async () => {
      expect((await call('?category=sports')).status).toBe(400);
      const response = await call('?status=archived');
      expect(response.status).toBe(400);
      expect((await errorOf(response)).code).toBe('invalid_filter');
    });

    it('creates an event with an empty gallery and logs it', async () => {
      const event = await createEvent();
      expect(event.id).toMatch(/^evt_[0-9a-f]{32}$/);
      expect(event.photos).toEqual([]);
      expect(event.slug).toBe('2026-10-mid-autumn-night');
      expect(await getEvent(event.id)).toEqual(event);
      expect(test.d1.rows('SELECT action, entity, entity_id, summary FROM change_log')).toEqual([
        { action: 'create', entity: 'event', entity_id: event.id, summary: '中秋晚会' },
      ]);
    });

    it('numbers a derived slug that is already taken', async () => {
      expect((await createEvent()).slug).toBe('2026-10-mid-autumn-night');
      expect((await createEvent()).slug).toBe('2026-10-mid-autumn-night-2');
      expect((await createEvent()).slug).toBe('2026-10-mid-autumn-night-3');
    });

    it('derives and numbers a slug from an English title longer than a D1 LIKE pattern allows', async () => {
      await createEvent();
      const title = { zh: '', en: 'Research Writing Workshop for First-Year Students in Mathematics' };
      const first = await createEvent({ title, startsAt: '2026-11-08T18:00', endsAt: null });
      expect(first.slug).toBe('2026-11-research-writing-workshop-for-first-year-students-in-mathematics');
      const second = await createEvent({ title, startsAt: '2026-11-08T18:00', endsAt: null });
      expect(second.slug).toBe('2026-11-research-writing-workshop-for-first-year-students-in-mathematics-2');
    });

    it('derives the month alone from a Chinese-only title, then numbers it', async () => {
      const chineseOnly = { title: { zh: '迎新会', en: '' } };
      expect((await createEvent(chineseOnly)).slug).toBe('2026-10');
      expect((await createEvent(chineseOnly)).slug).toBe('2026-10-2');
    });

    it('keeps an editor slug and refuses one another event uses', async () => {
      expect((await createEvent({ slug: 'Moon-Festival' })).slug).toBe('moon-festival');
      const response = await call('', send('POST', eventBody({ slug: 'moon-festival' })));
      expect(response.status).toBe(400);
      expect((await errorOf(response)).issues).toEqual([{ field: 'slug', message: '链接名已被其他活动使用' }]);
    });

    it('reports every invalid field at once', async () => {
      const response = await call('', send('POST', eventBody({ title: { zh: '', en: '' }, category: 'sports', endsAt: '2026-10-01T10:00' })));
      expect(response.status).toBe(400);
      const fields = (await errorOf(response)).issues?.map((issue) => issue.field);
      expect(fields).toEqual(expect.arrayContaining(['title.zh', 'category', 'endsAt']));
    });

    it('refuses a cover that was never uploaded', async () => {
      const response = await call('', send('POST', eventBody({ coverKey: 'img/2026/ffffffffffffffffffffffffffffffff.jpg' })));
      expect(response.status).toBe(400);
      expect((await errorOf(response)).issues).toEqual([{ field: 'coverKey', message: '文件不存在，请重新上传' }]);
    });

    it('reports a cover removed between the check and the write on the cover field', async () => {
      const cover = await uploadImage();
      const response = await call('', send('POST', eventBody({ coverKey: cover })), removingMediaBeforeWrite(test, cover));
      expect(response.status).toBe(400);
      expect((await errorOf(response)).issues).toEqual([{ field: 'coverKey', message: '文件不存在，请重新上传' }]);
      expect(test.d1.rows('SELECT id FROM events')).toEqual([]);
    });

    it('answers 404 for an unknown event', async () => {
      expect((await call('/evt_missing')).status).toBe(404);
      expect((await call('/evt_missing', send('PUT', { value: eventBody(), expectedUpdatedAt: '2026-10-01T00:00:00.000Z' }))).status).toBe(404);
      expect((await call('/evt_missing', send('DELETE'))).status).toBe(404);
    });

    it('updates an event, keeping its slug when the slug is left empty', async () => {
      const event = await createEvent();
      const response = await call(
        `/${event.id}`,
        send('PUT', { value: eventBody({ status: 'draft', title: { zh: '中秋游园会', en: 'Mid-Autumn Fair' } }), expectedUpdatedAt: event.updatedAt }),
      );
      expect(response.status).toBe(200);
      const saved = ((await response.json()) as EventResponse).event;
      expect(saved.slug).toBe(event.slug);
      expect(saved.status).toBe('draft');
      expect(saved.title.zh).toBe('中秋游园会');
      expect(saved.updatedAt > event.updatedAt).toBe(true);
      expect(saved.createdAt).toBe(event.createdAt);
    });

    it('lets an event keep its own slug but not take another one', async () => {
      const first = await createEvent({ slug: 'first' });
      const second = await createEvent({ slug: 'second' });
      const own = await call(`/${first.id}`, send('PUT', { value: eventBody({ slug: 'first' }), expectedUpdatedAt: first.updatedAt }));
      expect(own.status).toBe(200);
      const taken = await call(`/${second.id}`, send('PUT', { value: eventBody({ slug: 'first' }), expectedUpdatedAt: second.updatedAt }));
      expect(taken.status).toBe(400);
      expect((await errorOf(taken)).issues?.[0]?.field).toBe('slug');
    });

    it('refuses a save based on an outdated version', async () => {
      const event = await createEvent();
      const first = await call(`/${event.id}`, send('PUT', { value: eventBody({ status: 'draft' }), expectedUpdatedAt: event.updatedAt }));
      expect(first.status).toBe(200);
      const second = await call(`/${event.id}`, send('PUT', { value: eventBody(), expectedUpdatedAt: event.updatedAt }));
      expect(second.status).toBe(409);
      expect((await errorOf(second)).code).toBe('stale');
      expect((await getEvent(event.id)).status).toBe('draft');
      expect(test.d1.rows("SELECT id FROM change_log WHERE action = 'update'")).toHaveLength(1);
    });

    it('requires the version on update', async () => {
      const event = await createEvent();
      const response = await call(`/${event.id}`, send('PUT', { value: eventBody() }));
      expect(response.status).toBe(400);
      expect((await errorOf(response)).code).toBe('missing_version');
    });

    it('releases a replaced cover and keeps the new one', async () => {
      const oldCover = await uploadImage();
      const newCover = await uploadImage();
      const event = await createEvent({ coverKey: oldCover });
      const response = await call(`/${event.id}`, send('PUT', { value: eventBody({ coverKey: newCover }), expectedUpdatedAt: event.updatedAt }));
      expect(response.status).toBe(200);
      expect(isStored(oldCover)).toBe(false);
      expect(isStored(newCover)).toBe(true);
    });

    it('keeps a cover that another event still uses', async () => {
      const shared = await uploadImage();
      const event = await createEvent({ coverKey: shared });
      await createEvent({ coverKey: shared });
      await call(`/${event.id}`, send('PUT', { value: eventBody({ coverKey: null }), expectedUpdatedAt: event.updatedAt }));
      expect(isStored(shared)).toBe(true);
    });

    it('deletes an event with its gallery and releases the cover and every photo', async () => {
      const cover = await uploadImage();
      const photoKeys = [await uploadImage(), await uploadImage()];
      const event = await createEvent({ coverKey: cover });
      for (const mediaKey of photoKeys) expect((await addPhoto(event.id, { mediaKey })).status).toBe(201);

      const response = await call(`/${event.id}`, send('DELETE'));
      expect(response.status).toBe(204);
      expect((await call(`/${event.id}`)).status).toBe(404);
      expect(test.d1.rows('SELECT id FROM event_photos WHERE event_id = ?', event.id)).toEqual([]);
      for (const key of [cover, ...photoKeys]) expect(isStored(key), key).toBe(false);
      expect(test.d1.rows("SELECT entity FROM change_log WHERE action = 'delete'")).toEqual([{ entity: 'event' }]);
    });
  });

  describe('photos', () => {
    it('adds a photo without changing the event version', async () => {
      const event = await createEvent();
      const mediaKey = await uploadImage();
      const response = await addPhoto(event.id, { mediaKey, caption: { zh: '赏月', en: 'Moon viewing' }, sortOrder: 3 });
      expect(response.status).toBe(201);
      const { photo } = (await response.json()) as EventPhotoResponse;
      expect(photo).toMatchObject({ eventId: event.id, mediaKey, caption: { zh: '赏月', en: 'Moon viewing' }, sortOrder: 3 });
      expect(photo.id).toMatch(/^pho_[0-9a-f]{32}$/);

      const reloaded = await getEvent(event.id);
      expect(reloaded.updatedAt).toBe(event.updatedAt);
      expect(reloaded.photos).toEqual([photo]);
      const save = await call(`/${event.id}`, send('PUT', { value: eventBody(), expectedUpdatedAt: event.updatedAt }));
      expect(save.status).toBe(200);
    });

    it('lists the gallery by sort order', async () => {
      const event = await createEvent();
      const later = await uploadImage();
      const first = await uploadImage();
      await addPhoto(event.id, { mediaKey: later, sortOrder: 2 });
      await addPhoto(event.id, { mediaKey: first, sortOrder: 1 });
      expect((await getEvent(event.id)).photos.map((photo) => photo.mediaKey)).toEqual([first, later]);
    });

    it('refuses a photo that was never uploaded or is not an image', async () => {
      const event = await createEvent();
      const missing = await addPhoto(event.id, { mediaKey: 'img/2026/ffffffffffffffffffffffffffffffff.jpg' });
      expect(missing.status).toBe(400);
      expect((await errorOf(missing)).issues).toEqual([{ field: 'mediaKey', message: '文件不存在，请重新上传' }]);
      const document = await addPhoto(event.id, { mediaKey: 'doc/2026/ffffffffffffffffffffffffffffffff.pdf' });
      expect(document.status).toBe(400);
      expect((await errorOf(document)).issues?.[0]?.field).toBe('mediaKey');
    });

    it('reports a photo removed between the check and the write on the file field', async () => {
      const event = await createEvent();
      const mediaKey = await uploadImage();
      const response = await call(`/${event.id}/photos`, send('POST', { mediaKey }), removingMediaBeforeWrite(test, mediaKey));
      expect(response.status).toBe(400);
      expect((await errorOf(response)).issues).toEqual([{ field: 'mediaKey', message: '文件不存在，请重新上传' }]);
      expect((await getEvent(event.id)).photos).toEqual([]);
    });

    it('answers 404 when adding to an unknown event', async () => {
      const mediaKey = await uploadImage();
      expect((await addPhoto('evt_missing', { mediaKey })).status).toBe(404);
    });

    it(`stops at ${MAX_EVENT_PHOTOS} photos per event`, async () => {
      const event = await createEvent();
      const mediaKey = await uploadImage();
      test.d1.exec(`
        WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${MAX_EVENT_PHOTOS - 1})
        INSERT INTO event_photos (id, event_id, media_key, sort_order, created_at)
        SELECT 'pho_seed_' || i, '${event.id}', '${mediaKey}', i, '2026-10-04T00:00:00.000Z' FROM n`);

      expect((await addPhoto(event.id, { mediaKey })).status).toBe(201);
      const response = await addPhoto(event.id, { mediaKey });
      expect(response.status).toBe(400);
      expect((await errorOf(response)).code).toBe('too_many_photos');
      expect((await getEvent(event.id)).photos).toHaveLength(MAX_EVENT_PHOTOS);
    });

    it('updates the caption and order of a photo', async () => {
      const event = await createEvent();
      const created = ((await (await addPhoto(event.id, { mediaKey: await uploadImage() })).json()) as EventPhotoResponse).photo;
      const response = await call(`/${event.id}/photos/${created.id}`, send('PUT', { caption: { zh: '大合影', en: 'Group photo' }, sortOrder: 7 }));
      expect(response.status).toBe(200);
      const { photo } = (await response.json()) as EventPhotoResponse;
      expect(photo).toEqual({ ...created, caption: { zh: '大合影', en: 'Group photo' }, sortOrder: 7 });
      expect((await getEvent(event.id)).photos).toEqual([photo]);
    });

    it('answers 404 for a photo of another event and leaves it untouched', async () => {
      const event = await createEvent();
      const other = await createEvent();
      const mediaKey = await uploadImage();
      const photo = ((await (await addPhoto(event.id, { mediaKey })).json()) as EventPhotoResponse).photo;

      expect((await call(`/${other.id}/photos/${photo.id}`, send('PUT', { caption: { zh: '改', en: '' }, sortOrder: 1 }))).status).toBe(404);
      expect((await call(`/${other.id}/photos/${photo.id}`, send('DELETE'))).status).toBe(404);
      expect((await getEvent(event.id)).photos).toEqual([photo]);
      expect(isStored(mediaKey)).toBe(true);
    });

    it('deletes a photo and releases its file', async () => {
      const event = await createEvent();
      const mediaKey = await uploadImage();
      const photo = ((await (await addPhoto(event.id, { mediaKey })).json()) as EventPhotoResponse).photo;

      const response = await call(`/${event.id}/photos/${photo.id}`, send('DELETE'));
      expect(response.status).toBe(204);
      expect((await getEvent(event.id)).photos).toEqual([]);
      expect(isStored(mediaKey)).toBe(false);
      expect((await call(`/${event.id}/photos/${photo.id}`, send('DELETE'))).status).toBe(404);
      expect(test.d1.rows("SELECT action FROM change_log WHERE entity = 'event_photo' ORDER BY at, rowid")).toEqual([
        { action: 'create' },
        { action: 'delete' },
      ]);
    });
  });
});
