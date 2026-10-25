import { wallDateOf, type WallTime } from './toronto';

/**
 * Where an event or review session stands relative to now. The public site, the admin lists and the database
 * queries for "upcoming" all follow this one rule, so a card never says "past" in an upcoming list.
 * 活动或复习场次相对于现在所处的状态。公开网站、后台列表以及 "即将开始" 的数据库查询都遵循这同一条规则，
 * 因此近期列表中的卡片永远不会显示 "已结束"。
 */
export type TimeStatus = 'upcoming' | 'ongoing' | 'past' | 'tba';

/** The moment something is over: its end time, or the end of its start day when no end is given. */
/** 结束的时刻：以结束时间为准；未填写结束时间时，以开始当天结束为准。 */
export function effectiveEnd(startsAt: WallTime, endsAt: WallTime | null): WallTime {
  return endsAt ?? `${wallDateOf(startsAt)}T23:59`;
}

/** Upcoming until it starts, ongoing until it ends, past after that; without a start time, to be announced. */
/** 开始前为即将开始，结束前为进行中，之后为已结束；没有开始时间时为待定。 */
export function timeStatus(startsAt: WallTime | null, endsAt: WallTime | null, now: WallTime): TimeStatus {
  if (!startsAt) return 'tba';
  if (now < startsAt) return 'upcoming';
  return now <= effectiveEnd(startsAt, endsAt) ? 'ongoing' : 'past';
}
