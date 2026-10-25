import type { DeliveryMode, EventCategory, ExamKind, LocalizedText, MaterialKind, PublishStatus, TermKey, WallTime } from '@msc-web/content';
import { insertMedia } from '../../media';
import { newId } from '../../records';
import type { SqliteD1 } from '../../testing/sqlite-d1';

/**
 * Rows for tests of the public pages, written straight into SQLite with every column the pages read. Each helper
 * fills sensible defaults, so a test states only what it is about.
 * 公开页面测试使用的数据行，直接写入 SQLite，并包含页面会读取的每一列。每个辅助函数都会填入合理的默认值，测试只需写明与其相关的内容。
 */

/** 12:00 on Sunday 25 October 2026 in Toronto (EDT), during the 2026 fall term. */
/** 多伦多时间 2026 年 10 月 25 日（周日）12:00（夏令时），处于 2026 秋季学期。 */
export const TEST_INSTANT = new Date('2026-10-25T16:00:00Z');
export const TEST_NOW: WallTime = '2026-10-25T12:00';

const CREATED_AT = '2026-09-01T00:00:00.000Z';

function text(value: Partial<LocalizedText> | undefined, fallback: LocalizedText = { zh: '', en: '' }): LocalizedText {
  return { zh: value?.zh ?? fallback.zh, en: value?.en ?? fallback.en };
}

export interface EventSeed {
  slug: string;
  startsAt: WallTime;
  endsAt?: WallTime | null;
  status?: PublishStatus;
  category?: EventCategory;
  title?: Partial<LocalizedText>;
  summary?: Partial<LocalizedText>;
  body?: Partial<LocalizedText>;
  location?: Partial<LocalizedText>;
  coverKey?: string | null;
  registrationUrl?: string | null;
  updatedAt?: string;
}

export function seedEvent(d1: SqliteD1, seed: EventSeed): string {
  const id = newId('evt');
  const title = text(seed.title, { zh: `活动 ${seed.slug}`, en: `Event ${seed.slug}` });
  const summary = text(seed.summary);
  const body = text(seed.body);
  const location = text(seed.location);
  d1.raw
    .prepare(
      `INSERT INTO events (id, slug, category, status, title_zh, title_en, summary_zh, summary_en, body_zh, body_en, location_zh, location_en,
         starts_at, ends_at, cover_key, registration_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      seed.slug,
      seed.category ?? 'academic',
      seed.status ?? 'published',
      title.zh,
      title.en,
      summary.zh,
      summary.en,
      body.zh,
      body.en,
      location.zh,
      location.en,
      seed.startsAt,
      seed.endsAt ?? null,
      seed.coverKey ?? null,
      seed.registrationUrl ?? null,
      CREATED_AT,
      seed.updatedAt ?? CREATED_AT,
    );
  return id;
}

export function seedEventPhoto(d1: SqliteD1, seed: { eventId: string; mediaKey: string; caption?: Partial<LocalizedText>; sortOrder?: number; createdAt?: string }): string {
  const id = newId('pho');
  const caption = text(seed.caption);
  d1.raw
    .prepare('INSERT INTO event_photos (id, event_id, media_key, caption_zh, caption_en, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, seed.eventId, seed.mediaKey, caption.zh, caption.en, seed.sortOrder ?? 0, seed.createdAt ?? CREATED_AT);
  return id;
}

export interface CourseSeed {
  code: string;
  title?: Partial<LocalizedText>;
  description?: Partial<LocalizedText>;
  sortOrder?: number;
  visible?: boolean;
  updatedAt?: string;
}

export function seedCourse(d1: SqliteD1, seed: CourseSeed): string {
  const id = newId('crs');
  const title = text(seed.title, { zh: `${seed.code} 课程`, en: `${seed.code} course` });
  const description = text(seed.description);
  d1.raw
    .prepare(
      `INSERT INTO courses (id, code, title_zh, title_en, description_zh, description_en, sort_order, visible, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, seed.code, title.zh, title.en, description.zh, description.en, seed.sortOrder ?? 0, seed.visible === false ? 0 : 1, CREATED_AT, seed.updatedAt ?? CREATED_AT);
  return id;
}

export interface SessionSeed {
  courseId: string;
  term: TermKey;
  exam?: ExamKind;
  status?: PublishStatus;
  title?: Partial<LocalizedText>;
  startsAt?: WallTime | null;
  endsAt?: WallTime | null;
  mode?: DeliveryMode;
  location?: Partial<LocalizedText>;
  presenters?: string;
  registrationUrl?: string | null;
  recordingUrl?: string | null;
  notes?: Partial<LocalizedText>;
  updatedAt?: string;
}

export function seedSession(d1: SqliteD1, seed: SessionSeed): string {
  const id = newId('rvs');
  const title = text(seed.title);
  const location = text(seed.location);
  const notes = text(seed.notes);
  d1.raw
    .prepare(
      `INSERT INTO review_sessions (id, course_id, term, exam, status, title_zh, title_en, starts_at, ends_at, mode, location_zh, location_en,
         presenters, registration_url, recording_url, notes_zh, notes_en, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      seed.courseId,
      seed.term,
      seed.exam ?? 'midterm',
      seed.status ?? 'published',
      title.zh,
      title.en,
      seed.startsAt ?? null,
      seed.endsAt ?? null,
      seed.mode ?? 'in_person',
      location.zh,
      location.en,
      seed.presenters ?? '',
      seed.registrationUrl ?? null,
      seed.recordingUrl ?? null,
      notes.zh,
      notes.en,
      CREATED_AT,
      seed.updatedAt ?? CREATED_AT,
    );
  return id;
}

export function seedMaterial(
  d1: SqliteD1,
  seed: { sessionId: string; kind?: MaterialKind; label?: Partial<LocalizedText>; mediaKey?: string | null; url?: string | null; sortOrder?: number },
): string {
  const id = newId('mat');
  const label = text(seed.label);
  d1.raw
    .prepare('INSERT INTO review_materials (id, session_id, kind, label_zh, label_en, media_key, url, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, seed.sessionId, seed.kind ?? 'slides', label.zh, label.en, seed.mediaKey ?? null, seed.url ?? null, seed.sortOrder ?? 0, CREATED_AT);
  return id;
}

/** A stored upload with its media row, as the upload route leaves it. */
/** 一个已存储的上传文件及其媒体记录，与上传接口处理后的状态相同。 */
export async function seedMedia(db: D1Database, bucket: R2Bucket, key: string): Promise<void> {
  const isDocument = key.startsWith('doc/');
  await insertMedia(
    db,
    {
      key,
      url: `/media/${key}`,
      kind: isDocument ? 'document' : 'image',
      contentType: isDocument ? 'application/pdf' : 'image/jpeg',
      size: 4,
      width: isDocument ? null : 1200,
      height: isDocument ? null : 800,
      fileName: isDocument ? 'slides.pdf' : 'photo.jpg',
      createdAt: CREATED_AT,
    },
    'mem_events',
  );
  await bucket.put(key, new Uint8Array([1, 2, 3, 4]));
}
