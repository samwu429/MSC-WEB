import { torontoWallTime, type PublishStatus, type SummaryResponse } from '@msc-web/content';

export type ContentCounts = SummaryResponse['counts'];

const PUBLISHED: PublishStatus = 'published';
const DRAFT: PublishStatus = 'draft';

/**
 * Every dashboard count in one statement. ?1 is the published status, ?2 the draft status and ?3 the current Toronto
 * wall time, against which upcoming events are compared as strings.
 * 在一条语句中得到概览页的全部数量。?1 为已发布状态，?2 为草稿状态，?3 为当前的多伦多本地时间，即将举行的活动按字符串与它比较。
 */
const COUNTS_SQL = `SELECT
  (SELECT COUNT(*) FROM people WHERE visible = 1) AS people,
  (SELECT COUNT(*) FROM events WHERE status = ?1) AS events_published,
  (SELECT COUNT(*) FROM events WHERE status = ?2) AS events_draft,
  (SELECT COUNT(*) FROM events WHERE status = ?1 AND starts_at >= ?3) AS upcoming_events,
  (SELECT COUNT(*) FROM courses WHERE visible = 1) AS courses,
  (SELECT COUNT(*) FROM review_sessions WHERE status = ?1) AS review_sessions,
  (SELECT COUNT(*) FROM documents WHERE visible = 1) AS documents`;

interface CountsRow {
  people: number;
  events_published: number;
  events_draft: number;
  upcoming_events: number;
  courses: number;
  review_sessions: number;
  documents: number;
}

/** What the public site shows right now: visible people, courses and documents, and published events and sessions. */
/** 公开网站当前展示的内容：正在显示的成员、课程与文件，以及已发布的活动与复习场次。 */
export async function countContent(db: D1Database, now: Date): Promise<ContentCounts> {
  const row = await db.prepare(COUNTS_SQL).bind(PUBLISHED, DRAFT, torontoWallTime(now)).first<CountsRow>();
  return {
    people: row?.people ?? 0,
    eventsPublished: row?.events_published ?? 0,
    eventsDraft: row?.events_draft ?? 0,
    upcomingEvents: row?.upcoming_events ?? 0,
    courses: row?.courses ?? 0,
    reviewSessions: row?.review_sessions ?? 0,
    documents: row?.documents ?? 0,
  };
}
