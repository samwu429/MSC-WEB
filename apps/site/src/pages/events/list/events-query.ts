import { EVENT_CATEGORIES, IssueCollector, readInteger, type EventCategory } from '@msc-web/content';

/**
 * The query string of the events list: ?type=academic|extracurricular&page=N. Visitors edit these by hand, so an
 * unknown type shows every category and a page that is not a whole number of at least 1 shows the first page,
 * instead of an error.
 * 活动列表的查询字符串：?type=academic|extracurricular&page=N。访问者可能手动修改它们，因此未知类别显示全部类别，
 * 不是不小于 1 的整数的页码显示第一页，而不是报错。
 */

export const PAST_EVENTS_PAGE_SIZE = 12;

/** Far beyond any real page, so larger numbers still land past the end while the offset stays small. */
/** 远超任何真实存在的页码；更大的数字仍会落在末页之后，同时偏移量保持在较小范围。 */
const MAX_PAGE = 100_000;

export interface EventsQuery {
  category: EventCategory | null;
  page: number;
}

export function readEventsQuery(raw: { type?: string; page?: string }): EventsQuery {
  const category = EVENT_CATEGORIES.find((candidate) => candidate === raw.type) ?? null;
  const page = readInteger(new IssueCollector(), raw.page, 'page', { label: '页码', min: 1, max: Number.MAX_SAFE_INTEGER, fallback: 1 });
  return { category, page: Math.min(page, MAX_PAGE) };
}
