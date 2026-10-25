import { pickText, type AdminIdentity, type EventPhoto, type EventPhotoInput, type SiteEvent } from '@msc-web/content';
import { changeStatement } from './change-log';
import { newId, nowIso } from './records';
import { toEventPhoto, type EventPhotoRow } from './rows/events';

/**
 * The photo gallery of each event. Photos carry no version of their own and never touch the event's updated_at,
 * so adding pictures while another officer edits the event text does not cause a conflict. Change log entries
 * name the event, which tells readers whose gallery changed.
 * 每个活动的相册。照片没有自己的版本号，也从不修改活动的 updated_at，因此一位干部添加照片时，另一位干部编辑活动文字不会产生冲突。
 * 修改记录中写的是活动名称，读者据此知道是哪一个活动的相册发生了变化。
 */

export type EventPhotoChange = Pick<EventPhoto, 'caption' | 'sortOrder'>;

export async function listEventPhotos(db: D1Database, eventId: string): Promise<EventPhoto[]> {
  const result = await db
    .prepare('SELECT * FROM event_photos WHERE event_id = ? ORDER BY sort_order, created_at, id')
    .bind(eventId)
    .all<EventPhotoRow>();
  return result.results.map(toEventPhoto);
}

export async function countEventPhotos(db: D1Database, eventId: string): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) AS total FROM event_photos WHERE event_id = ?').bind(eventId).first<{ total: number }>();
  return row?.total ?? 0;
}

/** A photo only when it belongs to the given event. */
/** 仅当照片属于指定活动时返回该照片。 */
export async function findEventPhoto(db: D1Database, eventId: string, photoId: string): Promise<EventPhoto | null> {
  const row = await db.prepare('SELECT * FROM event_photos WHERE id = ? AND event_id = ?').bind(photoId, eventId).first<EventPhotoRow>();
  return row ? toEventPhoto(row) : null;
}

export async function insertEventPhoto(db: D1Database, identity: AdminIdentity, event: SiteEvent, input: EventPhotoInput): Promise<EventPhoto> {
  const photo: EventPhoto = { id: newId('pho'), eventId: event.id, ...input, createdAt: nowIso() };
  await db.batch([
    db
      .prepare(
        `INSERT INTO event_photos (id, event_id, media_key, caption_zh, caption_en, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(photo.id, photo.eventId, photo.mediaKey, photo.caption.zh, photo.caption.en, photo.sortOrder, photo.createdAt),
    changeStatement(db, identity, { action: 'create', entity: 'event_photo', entityId: photo.id, summary: pickText(event.title, 'zh') }),
  ]);
  return photo;
}

/** The saved photo, or null when it was deleted in the meantime. */
/** 返回保存后的照片；若照片已在此期间被删除则返回 null。 */
export async function updateEventPhoto(
  db: D1Database,
  identity: AdminIdentity,
  event: SiteEvent,
  photo: EventPhoto,
  change: EventPhotoChange,
): Promise<EventPhoto | null> {
  const [result] = await db.batch([
    db
      .prepare('UPDATE event_photos SET caption_zh = ?, caption_en = ?, sort_order = ? WHERE id = ? AND event_id = ?')
      .bind(change.caption.zh, change.caption.en, change.sortOrder, photo.id, event.id),
    changeStatement(db, identity, { action: 'update', entity: 'event_photo', entityId: photo.id, summary: pickText(event.title, 'zh') }),
  ]);
  return (result?.meta.changes ?? 0) > 0 ? { ...photo, caption: change.caption, sortOrder: change.sortOrder } : null;
}

/** Whether the photo was deleted; false when it was already gone. */
/** 照片是否已被删除；若照片早已不存在则返回 false。 */
export async function deleteEventPhoto(db: D1Database, identity: AdminIdentity, event: SiteEvent, photo: EventPhoto): Promise<boolean> {
  const [result] = await db.batch([
    db.prepare('DELETE FROM event_photos WHERE id = ? AND event_id = ?').bind(photo.id, event.id),
    changeStatement(db, identity, { action: 'delete', entity: 'event_photo', entityId: photo.id, summary: pickText(event.title, 'zh') }),
  ]);
  return (result?.meta.changes ?? 0) > 0;
}
