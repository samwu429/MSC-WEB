import { localeTag, type Locale } from '../locale/locale';
import { wallDateOf, wallTimeParts, weekdayOf, type WallDate, type WallTime } from './toronto';

/**
 * Dates and times as people read them on the site and in the backend. Values are Toronto wall times already, so
 * formatting only arranges the parts and never converts time zones.
 * 网站与后台按阅读习惯显示的日期与时间。数值本身已是多伦多本地时间，因此格式化只是排列各部分，从不转换时区。
 */

const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** "10月25日 周日" or "Sun, Oct 25", with the year added when it is not the current one. */
/** "10月25日 周日" 或 "Sun, Oct 25"；不是当年时加上年份。 */
export function formatDate(date: WallDate, locale: Locale, currentYear?: number): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const weekday = weekdayOf(date);
  const showYear = currentYear !== undefined && year !== currentYear;
  if (locale === 'zh') return `${showYear ? `${year}年` : ''}${month}月${day}日 ${WEEKDAYS_ZH[weekday]}`;
  return `${WEEKDAYS_EN[weekday]}, ${MONTHS_EN[month - 1]} ${day}${showYear ? `, ${year}` : ''}`;
}

/** "18:30" in Chinese, "6:30 PM" in English. */
/** 中文为 "18:30"，英文为 "6:30 PM"。 */
export function formatClock(time: WallTime, locale: Locale): string {
  const { hour, minute } = wallTimeParts(time);
  if (locale === 'zh') return `${pad(hour)}:${pad(minute)}`;
  const suffix = hour < 12 ? 'AM' : 'PM';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${pad(minute)} ${suffix}`;
}

/**
 * A start and optional end: "10月25日 周日 18:30–20:30", or with both dates when the end is on another day.
 * 开始时间与可选的结束时间："10月25日 周日 18:30–20:30"；结束在另一天时显示两个日期。
 */
export function formatTimeRange(startsAt: WallTime, endsAt: WallTime | null, locale: Locale, currentYear?: number): string {
  const start = `${formatDate(wallDateOf(startsAt), locale, currentYear)} ${formatClock(startsAt, locale)}`;
  if (!endsAt) return start;
  if (wallDateOf(endsAt) === wallDateOf(startsAt)) return `${start}–${formatClock(endsAt, locale)}`;
  return `${start} – ${formatDate(wallDateOf(endsAt), locale, currentYear)} ${formatClock(endsAt, locale)}`;
}

/** The parts of a calendar badge: "OCT" / "10月" and the day number. */
/** 日历徽章的各部分："OCT" / "10月" 与日期数字。 */
export function dateBadge(date: WallDate, locale: Locale): { month: string; day: string } {
  const month = Number(date.slice(5, 7));
  return {
    month: locale === 'zh' ? `${month}月` : (MONTHS_EN[month - 1] ?? '').toUpperCase(),
    day: String(Number(date.slice(8, 10))),
  };
}

/** A date for document lists: "2026年10月25日" or "October 25, 2026". */
/** 文件列表使用的日期："2026年10月25日" 或 "October 25, 2026"。 */
export function formatLongDate(date: WallDate, locale: Locale): string {
  const [year, month, day] = [Number(date.slice(0, 4)), Number(date.slice(5, 7)), Number(date.slice(8, 10))];
  if (locale === 'zh') return `${year}年${month}月${day}日`;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(localeTag(locale), { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
