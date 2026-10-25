/**
 * Event and review times are stored as Toronto wall time, "YYYY-MM-DDTHH:mm", exactly as the editor typed it into
 * a datetime-local field. Comparing two wall times is a string comparison, and "now" is converted to Toronto wall
 * time before comparing, so the site never needs UTC offsets or a time zone database of its own.
 * 活动与复习的时间以多伦多本地时间 "YYYY-MM-DDTHH:mm" 保存，与编辑者在 datetime-local 字段中输入的完全一致。
 * 比较两个本地时间就是比较字符串；"现在" 会先换算为多伦多本地时间再比较，因此网站无需自行处理 UTC 偏移或时区数据库。
 */

export const TORONTO_TIME_ZONE = 'America/Toronto';

/** "2026-10-25T18:30" in Toronto. */
/** 多伦多时间的 "2026-10-25T18:30"。 */
export type WallTime = string;

/** "2026-10-25". */
export type WallDate = string;

const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const WALL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function validDate(year: number, month: number, day: number): boolean {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1) return false;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= days;
}

export function isWallDate(value: unknown): value is WallDate {
  if (typeof value !== 'string') return false;
  const match = WALL_DATE.exec(value);
  if (!match) return false;
  return validDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function isWallTime(value: unknown): value is WallTime {
  if (typeof value !== 'string') return false;
  const match = WALL_TIME.exec(value);
  if (!match) return false;
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  return validDate(Number(match[1]), Number(match[2]), Number(match[3])) && hour <= 23 && minute <= 59;
}

const PARTS_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TORONTO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** The Toronto wall time of an instant. */
/** 某一时刻在多伦多的本地时间。 */
export function torontoWallTime(instant: Date): WallTime {
  const parts: Record<string, string> = {};
  for (const part of PARTS_FORMAT.formatToParts(instant)) parts[part.type] = part.value;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function wallDateOf(time: WallTime): WallDate {
  return time.slice(0, 10);
}

/** Year, month (1-12), day, hour and minute of a wall time that has passed isWallTime. */
/** 已通过 isWallTime 的本地时间的年、月（1-12）、日、时、分。 */
export function wallTimeParts(time: WallTime): { year: number; month: number; day: number; hour: number; minute: number } {
  return {
    year: Number(time.slice(0, 4)),
    month: Number(time.slice(5, 7)),
    day: Number(time.slice(8, 10)),
    hour: Number(time.slice(11, 13)),
    minute: Number(time.slice(14, 16)),
  };
}

/**
 * The weekday (0 Sunday to 6 Saturday) of a wall date. The calendar date alone decides it, so UTC arithmetic is
 * safe here even though the date is in Toronto.
 * 本地日期是星期几（0 为星期日，6 为星期六）。星期只由日历日期决定，因此即使日期属于多伦多，这里用 UTC 计算也是安全的。
 */
export function weekdayOf(date: WallDate): number {
  return new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))).getUTCDay();
}
