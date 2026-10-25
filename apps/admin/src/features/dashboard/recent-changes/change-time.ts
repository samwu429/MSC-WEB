import { formatClock, formatLongDate, torontoWallTime, wallDateOf, wallTimeParts, type WallDate } from '@msc-web/content';

function previousDate(date: WallDate): WallDate {
  const { year, month, day } = wallTimeParts(`${date}T00:00`);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

/**
 * Change log timestamps are UTC instants; officers read them as Toronto local time. Today and yesterday are named
 * ("今天 09:05", "昨天 22:30"), other days show the date ("3月1日 10:00"), and the year appears only when it is not
 * the current one. A value that is not a valid instant is shown unchanged.
 * 修改记录的时间戳是 UTC 时刻，干部按多伦多本地时间阅读。今天与昨天直接写明（"今天 09:05"、"昨天 22:30"），
 * 其他日期显示月日（"3月1日 10:00"），不是当年时才显示年份。无法解析的值原样显示。
 */
export function formatChangeTime(at: string, now: Date): string {
  const instant = new Date(at);
  if (Number.isNaN(instant.getTime())) return at;
  const wallTime = torontoWallTime(instant);
  const date = wallDateOf(wallTime);
  const clock = formatClock(wallTime, 'zh');
  const today = wallDateOf(torontoWallTime(now));
  if (date === today) return `今天 ${clock}`;
  if (date === previousDate(today)) return `昨天 ${clock}`;
  if (date.slice(0, 4) !== today.slice(0, 4)) return `${formatLongDate(date, 'zh')} ${clock}`;
  const { month, day } = wallTimeParts(wallTime);
  return `${month}月${day}日 ${clock}`;
}
