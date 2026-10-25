import { Hono } from 'hono';
import { EVENT_LIMITS, validateEventPhotoInput, validateEventPhotoUpdate, type EventPhoto, type EventPhotoResponse, type SiteEvent } from '@msc-web/content';
import { findEvent } from '../../../../infrastructure/d1/events';
import { countEventPhotos, deleteEventPhoto, findEventPhoto, insertEventPhoto, updateEventPhoto } from '../../../../infrastructure/d1/event-photos';
import { releaseMedia } from '../../../../infrastructure/media/release';
import type { AppEnv } from '../../../context';
import { badRequest, notFound } from '../../../errors';
import { readJsonBody, validOrThrow } from '../../../request/body';
import { guardWrite } from '../../../request/guard-write';
import { requireMediaKeys } from '../../../request/media';

/**
 * Photos in an event's gallery, mounted under /admin/api/events. The public event page shows the whole gallery,
 * so the number of photos is capped to keep that page quick to load on a phone.
 * 活动相册中的照片，挂载在 /admin/api/events 之下。公开的活动页面会展示整个相册，因此限制照片数量，使该页面在手机上也能快速加载。
 */
export const eventPhotoRoutes = new Hono<AppEnv>();

export const MAX_EVENT_PHOTOS = EVENT_LIMITS.photos;

/** The event and one photo of its gallery; 404 when either is gone or the photo belongs to another event. */
/** 活动及其相册中的一张照片；任一方不存在，或照片属于其他活动时返回 404。 */
async function findGalleryPhoto(db: D1Database, eventId: string, photoId: string): Promise<{ event: SiteEvent; photo: EventPhoto }> {
  const event = await findEvent(db, eventId);
  const photo = event ? await findEventPhoto(db, event.id, photoId) : null;
  if (!event || !photo) throw notFound();
  return { event, photo };
}

eventPhotoRoutes.post('/:id/photos', async (c) => {
  const input = validOrThrow(validateEventPhotoInput(await readJsonBody(c)));
  const db = c.env.DB;
  const event = await findEvent(db, c.req.param('id'));
  if (!event) throw notFound();
  if ((await countEventPhotos(db, event.id)) >= MAX_EVENT_PHOTOS) {
    throw badRequest('too_many_photos', `每个活动最多上传 ${MAX_EVENT_PHOTOS} 张照片`);
  }
  await requireMediaKeys(db, [{ field: 'mediaKey', key: input.mediaKey, kind: 'image' }]);
  const photo = await guardWrite(() => insertEventPhoto(db, c.get('identity'), event, input), { mediaField: 'mediaKey' });
  const response: EventPhotoResponse = { photo };
  return c.json(response, 201);
});

eventPhotoRoutes.put('/:id/photos/:photoId', async (c) => {
  const change = validOrThrow(validateEventPhotoUpdate(await readJsonBody(c)));
  const db = c.env.DB;
  const { event, photo } = await findGalleryPhoto(db, c.req.param('id'), c.req.param('photoId'));
  const saved = await updateEventPhoto(db, c.get('identity'), event, photo, change);
  if (!saved) throw notFound();
  const response: EventPhotoResponse = { photo: saved };
  return c.json(response);
});

eventPhotoRoutes.delete('/:id/photos/:photoId', async (c) => {
  const db = c.env.DB;
  const { event, photo } = await findGalleryPhoto(db, c.req.param('id'), c.req.param('photoId'));
  if (!(await deleteEventPhoto(db, c.get('identity'), event, photo))) throw notFound();
  c.executionCtx.waitUntil(releaseMedia(c.env, [photo.mediaKey]));
  return c.body(null, 204);
});
