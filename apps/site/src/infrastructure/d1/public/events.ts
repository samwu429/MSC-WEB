import type { EventCategory, PublishStatus, SiteEvent, SiteEventDetail, WallTime } from '@msc-web/content';
import { toEventPhoto, toSiteEvent, type EventPhotoRow, type EventRow } from '../rows/events';

/**
 * Read queries behind the public event pages and the interest class lists. Only published events ever leave the
 * database. An event is upcoming until it starts and has ended once "now" is past its end, or past the end of its
 * start day when it has no end: the same rule eventStatus applies on the page, so a card never shows "past" in the
 * upcoming list. An event an officer marked as ended (archived) has ended whatever its date. Interest classes follow
 * the same rules.
 * 公开活动页面与兴趣课列表背后的读取查询。只有已发布的活动会被读出数据库。活动在开始前为即将开始；当现在晚于其结束时间
 * （没有结束时间时为开始当天结束）即为已结束。这与页面上 eventStatus 的规则一致，因此近期列表中的卡片永远不会显示 "已结束"。
 * 被干部标记为已结束（已归档）的活动无论日期如何都视为已结束。兴趣课遵循同样的规则。
 */

const PUBLISHED: PublishStatus = 'published';

const EVENT_END = "COALESCE(ends_at, substr(starts_at, 1, 10) || 'T23:59')";

/** ?1 status, ?2 category or null for all, ?3 now. */
/** ?1 为发布状态，?2 为类别（为 null 时表示全部），?3 为现在。 */
const NOT_ENDED = `status = ?1 AND (?2 IS NULL OR category = ?2) AND archived = 0 AND (starts_at > ?3 OR ${EVENT_END} >= ?3)`;
const ENDED = `status = ?1 AND (?2 IS NULL OR category = ?2) AND (archived = 1 OR (starts_at <= ?3 AND ${EVENT_END} < ?3))`;

/**
 * Interest classes: academic events marked as such. The category is checked with the mark, as isInterestClass does,
 * so a mark left on an event of another category never lists it here.
 * 兴趣课：被标记为兴趣课的学术活动。与 isInterestClass 一样，标记与类别一起检查，因此留在其他类别活动上的标记永远不会让它出现在这里。
 */
const INTEREST_CLASS = "category = 'academic' AND interest_class = 1";

export interface UpcomingEventsOptions {
  category?: EventCategory | null;
  /** Omitted for every upcoming event. */
  /** 省略时返回全部即将开始的活动。 */
  limit?: number;
}

/** Published events matching `where` that have not ended, earliest start first. */
/** 符合 `where` 且尚未结束的已发布活动，按开始时间从早到晚排列。 */
async function selectUpcoming(db: D1Database, where: string, now: WallTime, category: EventCategory | null, limit: number | undefined): Promise<SiteEvent[]> {
  const { results } = await db
    .prepare(`SELECT * FROM events WHERE ${where} ORDER BY starts_at, id LIMIT ?4`)
    .bind(PUBLISHED, category, now, limit ?? -1)
    .all<EventRow>();
  return results.map(toSiteEvent);
}

/** Published events that have not ended, ongoing ones included, earliest start first. */
/** 尚未结束的已发布活动（包括进行中的），按开始时间从早到晚排列。 */
export async function listUpcomingEvents(db: D1Database, now: WallTime, options: UpcomingEventsOptions = {}): Promise<SiteEvent[]> {
  return selectUpcoming(db, NOT_ENDED, now, options.category ?? null, options.limit);
}

/** Published interest classes that have not ended, ongoing ones included, earliest start first. */
/** 尚未结束的已发布兴趣课（包括进行中的），按开始时间从早到晚排列。 */
export async function listUpcomingInterestClasses(db: D1Database, now: WallTime, options: { limit?: number } = {}): Promise<SiteEvent[]> {
  return selectUpcoming(db, `${NOT_ENDED} AND ${INTEREST_CLASS}`, now, null, options.limit);
}

export interface PastEventsPage {
  events: SiteEvent[];
  /** Ended events across every page, for the pager. */
  /** 所有页中已结束活动的总数，供分页使用。 */
  total: number;
}

export interface PastPageOptions {
  page: number;
  pageSize: number;
}

/** How many published events match `where`. */
/** 符合 `where` 的已发布活动数量。 */
async function countWhere(db: D1Database, where: string, now: WallTime, category: EventCategory | null): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS total FROM events WHERE ${where}`).bind(PUBLISHED, category, now).first<{ total: number }>();
  return Number(row?.total ?? 0);
}

/** One page of published events matching `where` that have ended, latest start first, and how many there are. */
/** 符合 `where` 且已结束的已发布活动中的一页（按开始时间从晚到早排列），以及其总数。 */
async function selectPast(db: D1Database, where: string, now: WallTime, category: EventCategory | null, options: PastPageOptions): Promise<PastEventsPage> {
  const offset = (options.page - 1) * options.pageSize;
  const [total, page] = await Promise.all([
    countWhere(db, where, now, category),
    db
      .prepare(`SELECT * FROM events WHERE ${where} ORDER BY starts_at DESC, id DESC LIMIT ?4 OFFSET ?5`)
      .bind(PUBLISHED, category, now, options.pageSize, offset)
      .all<EventRow>(),
  ]);
  return { events: page.results.map(toSiteEvent), total };
}

/** One page of published events that have ended, latest start first. Pages count from 1. */
/** 已结束的已发布活动中的一页，按开始时间从晚到早排列。页码从 1 开始。 */
export async function listPastEvents(
  db: D1Database,
  now: WallTime,
  options: PastPageOptions & { category: EventCategory | null },
): Promise<PastEventsPage> {
  return selectPast(db, ENDED, now, options.category, options);
}

/** One page of published interest classes that have ended, latest start first. Pages count from 1. */
/** 已结束的已发布兴趣课中的一页，按开始时间从晚到早排列。页码从 1 开始。 */
export async function listPastInterestClasses(db: D1Database, now: WallTime, options: PastPageOptions): Promise<PastEventsPage> {
  return selectPast(db, `${ENDED} AND ${INTEREST_CLASS}`, now, null, options);
}

/** How many published interest classes have ended; none means the first ones are still to come. */
/** 已结束的已发布兴趣课数量；为零表示第一批兴趣课尚未举办。 */
export async function countPastInterestClasses(db: D1Database, now: WallTime): Promise<number> {
  return countWhere(db, `${ENDED} AND ${INTEREST_CLASS}`, now, null);
}

/** A published event by its slug, with its gallery in display order; null for drafts and unknown slugs. */
/** 按 slug 查找已发布的活动，并附带按展示顺序排列的相册；草稿或不存在的 slug 返回 null。 */
export async function findPublishedEvent(db: D1Database, slug: string): Promise<SiteEventDetail | null> {
  const [row, photos] = await Promise.all([
    db.prepare('SELECT * FROM events WHERE slug = ? AND status = ?').bind(slug, PUBLISHED).first<EventRow>(),
    db
      .prepare(
        `SELECT p.* FROM event_photos p JOIN events e ON e.id = p.event_id
         WHERE e.slug = ? AND e.status = ?
         ORDER BY p.sort_order, p.created_at, p.id`,
      )
      .bind(slug, PUBLISHED)
      .all<EventPhotoRow>(),
  ]);
  return row ? { ...toSiteEvent(row), photos: photos.results.map(toEventPhoto) } : null;
}

export interface EventLink {
  slug: string;
  /** The later of the event's own update and its newest photo. */
  /** 活动自身更新时间与其最新照片时间中较晚的一个。 */
  updatedAt: string;
}

/** Every published event for the sitemap, latest start first. */
/** 站点地图所需的全部已发布活动，按开始时间从晚到早排列。 */
export async function listPublishedEventLinks(db: D1Database): Promise<EventLink[]> {
  const { results } = await db
    .prepare(
      `SELECT e.slug, MAX(e.updated_at, COALESCE(MAX(p.created_at), '')) AS updated_at
       FROM events e LEFT JOIN event_photos p ON p.event_id = e.id
       WHERE e.status = ?
       GROUP BY e.id
       ORDER BY e.starts_at DESC, e.id DESC`,
    )
    .bind(PUBLISHED)
    .all<{ slug: string; updated_at: string }>();
  return results.map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
}
