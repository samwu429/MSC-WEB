import type { PublishStatus } from '@msc-web/content';

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

