import { formatTimeRange, isWallTime, wallTimeParts, type WallTime } from '@msc-web/content';

export const TIME_TO_BE_ANNOUNCED = '时间待定';

/**
 * When a session takes place, for the editor's lists: "2026年10月25日 周日 18:30–20:30", both dates when it ends
 * on another day, and 时间待定 while no start is set. Lists span several terms, so the start's year is always shown;
 * the end repeats it only when it falls in another year.
 * 复习场次的时间，供后台列表显示："2026年10月25日 周日 18:30–20:30"；结束在另一天时显示两个日期；未设置开始时间时为
 * 时间待定。列表跨越多个学期，因此始终显示开始日期的年份；结束日期只在年份不同时才再次显示年份。
 */
export function formatSchedule(startsAt: WallTime | null, endsAt: WallTime | null): string {
  if (!startsAt || !isWallTime(startsAt)) return TIME_TO_BE_ANNOUNCED;
  const { year } = wallTimeParts(startsAt);
  return `${year}年${formatTimeRange(startsAt, endsAt && isWallTime(endsAt) ? endsAt : null, 'zh', year)}`;
}
