import type { LocalizedText, PublishStatus } from '@msc-web/content';

/**
 * Read queries only the home page needs; its event and review lists reuse the queries of those pages. Only
 * published events and published sessions of visible courses are ever counted or read.
 * 仅首页需要的读取查询；首页的活动与复习列表复用对应页面的查询。只统计或读取已发布的活动，以及可见课程中已发布的复习场次。
 */

const PUBLISHED: PublishStatus = 'published';

export interface HomeStats {
  reviewSessions: number;
  events: number;
  coursesWithReviews: number;
}

interface HomeStatsRow {
  review_sessions: number;
  courses: number;
  events: number;
}

export async function countHomeStats(db: D1Database): Promise<HomeStats> {
  const row = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM review_sessions s JOIN courses c ON c.id = s.course_id
          WHERE s.status = ?1 AND c.visible = 1) AS review_sessions,
         (SELECT COUNT(DISTINCT s.course_id) FROM review_sessions s JOIN courses c ON c.id = s.course_id
          WHERE s.status = ?1 AND c.visible = 1) AS courses,
         (SELECT COUNT(*) FROM events WHERE status = ?1) AS events`,
    )
    .bind(PUBLISHED)
    .first<HomeStatsRow>();
  return {
    reviewSessions: Number(row?.review_sessions ?? 0),
    events: Number(row?.events ?? 0),
    coursesWithReviews: Number(row?.courses ?? 0),
  };
}

export interface HighlightPhoto {
  mediaKey: string;
  eventSlug: string;
  eventTitle: LocalizedText;
}

interface HighlightPhotoRow {
  media_key: string;
  slug: string;
  title_zh: string;
  title_en: string;
}

/** The most recently added photos of published events, with the event each one links to. */
/** 已发布活动中最近添加的照片，以及每张照片所链接的活动。 */
export async function listHighlightPhotos(db: D1Database, limit: number): Promise<HighlightPhoto[]> {
  const { results } = await db
    .prepare(
      `SELECT p.media_key, e.slug, e.title_zh, e.title_en
       FROM event_photos p JOIN events e ON e.id = p.event_id
       WHERE e.status = ?
       ORDER BY p.created_at DESC, p.sort_order, p.id
       LIMIT ?`,
    )
    .bind(PUBLISHED, limit)
    .all<HighlightPhotoRow>();
  return results.map((row) => ({ mediaKey: row.media_key, eventSlug: row.slug, eventTitle: { zh: row.title_zh, en: row.title_en } }));
}
