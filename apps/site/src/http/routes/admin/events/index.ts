import { Hono } from 'hono';
import {
  EVENT_CATEGORIES,
  PUBLISH_STATUSES,
  suggestEventSlug,
  validateEventInput,
  type EventInput,
  type EventResponse,
  type EventsResponse,
  type SiteEvent,
} from '@msc-web/content';
import { firstFreeSlug, slugStem } from '../../../../domain/events/slug-allocation';
import {
  deleteEvent,
  findEvent,
  findEventDetail,
  findEventIdBySlug,
  insertEvent,
  listEventSlugsStartingWith,
  listEvents,
  updateEvent,
} from '../../../../infrastructure/d1/events';
import { droppedKeys, releaseMedia } from '../../../../infrastructure/media/release';
import type { AppEnv } from '../../../context';
import { badRequest, invalid, notFound, stale, type HttpError } from '../../../errors';
import { readJsonBody, readVersionedBody, validOrThrow } from '../../../request/body';
import { guardWrite, type WriteGuards } from '../../../request/guard-write';
import { requireMediaKeys } from '../../../request/media';
import { eventPhotoRoutes } from './photos';

/**
 * Events and their photo galleries in the editing backend. The event form saves the whole record with an
 * optimistic version check; gallery photos are managed one at a time by the routes in photos.ts.
 * 编辑后台中的活动及其相册。活动表单以乐观版本检查保存整条记录；相册照片由 photos.ts 中的路由逐张管理。
 */
export const eventRoutes = new Hono<AppEnv>();

function slugTaken(): HttpError {
  return invalid([{ field: 'slug', message: '链接名已被其他活动使用' }]);
}

/** A list filter from the query string: absent or empty means all, any other unknown value is refused. */
/** 查询字符串中的列表筛选条件：缺省或为空表示全部，其他未知取值一律拒绝。 */
function readFilter<T extends string>(value: string | undefined, allowed: readonly T[], message: string): T | undefined {
  if (!value) return undefined;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw badRequest('invalid_filter', message);
}

/**
 * The slug to save. An editor's own slug must not belong to another event. An empty one keeps the current slug on
 * update, and on create becomes the month and English title, numbered when that is already taken.
 * 要保存的 slug。编辑者填写的 slug 不能属于其他活动。留空时，更新会保留当前 slug；创建时则由月份与英文标题生成，若已被占用则追加编号。
 */
async function resolveSlug(db: D1Database, input: EventInput, current: SiteEvent | null): Promise<string> {
  if (input.slug) {
    const owner = await findEventIdBySlug(db, input.slug);
    if (owner && owner !== current?.id) throw slugTaken();
    return input.slug;
  }
  if (current) return current.slug;
  const base = suggestEventSlug(input.title.en, input.startsAt);
  return firstFreeSlug(base, await listEventSlugsStartingWith(db, slugStem(base)));
}

/** Ids are random, so a UNIQUE failure means another save claimed the slug between the check and the write. */
/** id 是随机生成的，因此 UNIQUE 失败意味着在检查与写入之间，另一次保存占用了该 slug。 */
const EVENT_WRITE: WriteGuards = { unique: slugTaken, mediaField: 'coverKey' };

eventRoutes.get('/', async (c) => {
  const category = readFilter(c.req.query('category'), EVENT_CATEGORIES, '活动类别不正确');
  const status = readFilter(c.req.query('status'), PUBLISH_STATUSES, '发布状态不正确');
  const response: EventsResponse = { events: await listEvents(c.env.DB, { category, status }) };
  return c.json(response);
});

eventRoutes.post('/', async (c) => {
  const input = validOrThrow(validateEventInput(await readJsonBody(c)));
  const db = c.env.DB;
  const slug = await resolveSlug(db, input, null);
  await requireMediaKeys(db, [{ field: 'coverKey', key: input.coverKey, kind: 'image' }]);
  const event = await guardWrite(() => insertEvent(db, c.get('identity'), { ...input, slug }), EVENT_WRITE);
  const response: EventResponse = { event: { ...event, photos: [] } };
  return c.json(response, 201);
});

eventRoutes.get('/:id', async (c) => {
  const event = await findEventDetail(c.env.DB, c.req.param('id'));
  if (!event) throw notFound();
  const response: EventResponse = { event };
  return c.json(response);
});

eventRoutes.put('/:id', async (c) => {
  const { value, expectedUpdatedAt } = await readVersionedBody(c);
  const input = validOrThrow(validateEventInput(value));
  const db = c.env.DB;
  const id = c.req.param('id');
  const current = await findEvent(db, id);
  if (!current) throw notFound();
  // Refusing an outdated version before writing keeps a rejected save out of the change log.
  // 在写入前拒绝过期版本，被拒绝的保存因此不会进入修改记录。
  if (current.updatedAt !== expectedUpdatedAt) throw stale();
  const slug = await resolveSlug(db, input, current);
  await requireMediaKeys(db, [{ field: 'coverKey', key: input.coverKey, kind: 'image' }]);
  const outcome = await guardWrite(() => updateEvent(db, c.get('identity'), id, { ...input, slug }, expectedUpdatedAt), EVENT_WRITE);
  if (outcome === 'missing') throw notFound();
  if (outcome === 'stale') throw stale();
  c.executionCtx.waitUntil(releaseMedia(c.env, droppedKeys([current.coverKey], [input.coverKey])));
  const event = await findEventDetail(db, id);
  if (!event) throw notFound();
  const response: EventResponse = { event };
  return c.json(response);
});

eventRoutes.delete('/:id', async (c) => {
  const db = c.env.DB;
  const event = await findEventDetail(db, c.req.param('id'));
  if (!event) throw notFound();
  if (!(await deleteEvent(db, c.get('identity'), event))) throw notFound();
  c.executionCtx.waitUntil(releaseMedia(c.env, [event.coverKey, ...event.photos.map((photo) => photo.mediaKey)]));
  return c.body(null, 204);
});

eventRoutes.route('/', eventPhotoRoutes);
