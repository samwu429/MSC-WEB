import {
  pickText,
  type AdminIdentity,
  type EventCategory,
  type EventInput,
  type PublishStatus,
  type SiteEvent,
  type SiteEventDetail,
} from '@msc-web/content';
import { changeStatement } from './change-log';
import { listEventPhotos } from './event-photos';
import { newId, nextVersion, nowIso, versionedOutcome, type VersionedOutcome } from './records';
import { toSiteEvent, type EventRow } from './rows/events';

const EVENTS_TABLE = 'events';

export interface EventFilter {
  category?: EventCategory;
  status?: PublishStatus;
}

/** Events for the editor's list, latest start first. */
/** 编辑列表中的活动，按开始时间从晚到早排列。 */
export async function listEvents(db: D1Database, filter: EventFilter = {}): Promise<SiteEvent[]> {
  const conditions: string[] = [];
  const values: string[] = [];
  if (filter.category) {
    conditions.push('category = ?');
    values.push(filter.category);
  }
  if (filter.status) {
    conditions.push('status = ?');
    values.push(filter.status);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db
    .prepare(`SELECT * FROM events ${where} ORDER BY starts_at DESC, created_at DESC`)
    .bind(...values)
    .all<EventRow>();
  return result.results.map(toSiteEvent);
}

export async function findEvent(db: D1Database, id: string): Promise<SiteEvent | null> {
  const row = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<EventRow>();
  return row ? toSiteEvent(row) : null;
}

/** An event with its gallery in display order. */
/** 带相册的活动，照片按展示顺序排列。 */
export async function findEventDetail(db: D1Database, id: string): Promise<SiteEventDetail | null> {
  const [event, photos] = await Promise.all([findEvent(db, id), listEventPhotos(db, id)]);
  return event ? { ...event, photos } : null;
}

/** The id of the event that uses a slug, if any. */
/** 使用该 slug 的活动 id；没有则为 null。 */
export async function findEventIdBySlug(db: D1Database, slug: string): Promise<string | null> {
  const row = await db.prepare('SELECT id FROM events WHERE slug = ?').bind(slug).first<{ id: string }>();
  return row?.id ?? null;
}

/**
 * Every slug that begins with `prefix`, compared exactly. LIKE is avoided because D1 refuses patterns over 50 bytes,
 * which a stem from a long English title exceeds. Slugs are ASCII, so `prefix.length` counts what substr counts.
 * 所有以 `prefix` 开头的 slug，按字面精确比较。这里不用 LIKE，因为 D1 拒绝超过 50 字节的模式，而长英文标题生成的词干会超过这个长度。
 * slug 只含 ASCII 字符，因此 `prefix.length` 与 substr 计数的单位相同。
 */
export async function listEventSlugsStartingWith(db: D1Database, prefix: string): Promise<string[]> {
  const result = await db.prepare('SELECT slug FROM events WHERE substr(slug, 1, ?2) = ?1').bind(prefix, prefix.length).all<{ slug: string }>();
  return result.results.map((row) => row.slug);
}

/** Values for the columns slug through registration_url, in the order the insert and the update both list them. */
/** slug 至 registration_url 各列的值，顺序与插入和更新语句中列出的顺序一致。 */
function contentValues(input: EventInput): (string | null)[] {
  return [
    input.slug,
    input.category,
    input.status,
    input.title.zh,
    input.title.en,
    input.summary.zh,
    input.summary.en,
    input.body.zh,
    input.body.en,
    input.location.zh,
    input.location.en,
    input.startsAt,
    input.endsAt,
    input.coverKey,
    input.registrationUrl,
  ];
}

/** Saves a new event; `input.slug` must already be resolved. */
/** 保存新活动；`input.slug` 必须已确定。 */
export async function insertEvent(db: D1Database, identity: AdminIdentity, input: EventInput): Promise<SiteEvent> {
  const now = nowIso();
  const event: SiteEvent = { ...input, id: newId('evt'), createdAt: now, updatedAt: now };
  await db.batch([
    db
      .prepare(
        `INSERT INTO events (id, slug, category, status, title_zh, title_en, summary_zh, summary_en, body_zh, body_en, location_zh,
           location_en, starts_at, ends_at, cover_key, registration_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(event.id, ...contentValues(event), event.createdAt, event.updatedAt),
    changeStatement(db, identity, { action: 'create', entity: 'event', entityId: event.id, summary: pickText(event.title, 'zh') }),
  ]);
  return event;
}

/** Replaces an event's content when its stored version is still `expectedUpdatedAt`; `input.slug` must already be resolved. */
/** 当库中版本仍为 `expectedUpdatedAt` 时替换活动内容；`input.slug` 必须已确定。 */
export async function updateEvent(
  db: D1Database,
  identity: AdminIdentity,
  id: string,
  input: EventInput,
  expectedUpdatedAt: string,
): Promise<VersionedOutcome> {
  const [result] = await db.batch([
    db
      .prepare(
        `UPDATE events SET slug = ?, category = ?, status = ?, title_zh = ?, title_en = ?, summary_zh = ?, summary_en = ?, body_zh = ?,
           body_en = ?, location_zh = ?, location_en = ?, starts_at = ?, ends_at = ?, cover_key = ?, registration_url = ?, updated_at = ?
         WHERE id = ? AND updated_at = ?`,
      )
      .bind(...contentValues(input), nextVersion(expectedUpdatedAt), id, expectedUpdatedAt),
    changeStatement(db, identity, { action: 'update', entity: 'event', entityId: id, summary: pickText(input.title, 'zh') }),
  ]);
  return versionedOutcome(db, EVENTS_TABLE, id, result?.meta.changes ?? 0);
}

/** Deletes an event; its photos go with it through ON DELETE CASCADE. Returns whether the event was still there. */
/** 删除活动；其照片通过 ON DELETE CASCADE 一并删除。返回活动在删除时是否仍存在。 */
export async function deleteEvent(db: D1Database, identity: AdminIdentity, event: SiteEvent): Promise<boolean> {
  const [result] = await db.batch([
    db.prepare('DELETE FROM events WHERE id = ?').bind(event.id),
    changeStatement(db, identity, { action: 'delete', entity: 'event', entityId: event.id, summary: pickText(event.title, 'zh') }),
  ]);
  return (result?.meta.changes ?? 0) > 0;
}
