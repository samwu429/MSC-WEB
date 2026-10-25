import type { LocalizedText } from '../locale/locale';
import { isWallDate, type WallDate } from '../time/toronto';

/**
 * Test reviews are organised by academic term. A term key is "<year>-<season>", such as "2026-fall". At UTM the
 * Winter term runs January to April, Summer May to August, and Fall September to December, so within one year the
 * chronological order is winter, summer, fall.
 * 考前复习按学期组织。学期键为 "<年份>-<季节>"，例如 "2026-fall"。在 UTM，冬季学期为 1 至 4 月，夏季学期为 5 至 8 月，
 * 秋季学期为 9 至 12 月，因此同一年内按时间顺序依次为冬季、夏季、秋季。
 */

export const TERM_SEASONS = ['winter', 'summer', 'fall'] as const;

export type TermSeason = (typeof TERM_SEASONS)[number];

export type TermKey = `${number}-${TermSeason}`;

const TERM_KEY = /^(\d{4})-(winter|summer|fall)$/;

export const TERM_SEASON_LABELS: Record<TermSeason, LocalizedText> = {
  winter: { zh: '冬季学期', en: 'Winter' },
  summer: { zh: '夏季学期', en: 'Summer' },
  fall: { zh: '秋季学期', en: 'Fall' },
};

export function isTermKey(value: unknown): value is TermKey {
  if (typeof value !== 'string') return false;
  const match = TERM_KEY.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  return year >= 2000 && year <= 2100;
}

export function parseTerm(key: TermKey): { year: number; season: TermSeason } {
  const [year, season] = key.split('-') as [string, TermSeason];
  return { year: Number(year), season };
}

export function termKey(year: number, season: TermSeason): TermKey {
  return `${year}-${season}`;
}

/** The term a calendar date falls in. */
/** 某个日历日期所在的学期。 */
export function termOfDate(date: WallDate): TermKey {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const season: TermSeason = month <= 4 ? 'winter' : month <= 8 ? 'summer' : 'fall';
  return termKey(year, season);
}

/** Chronological order: negative when a is earlier. */
/** 按时间先后排序：a 较早时返回负数。 */
export function compareTerms(a: TermKey, b: TermKey): number {
  const left = parseTerm(a);
  const right = parseTerm(b);
  if (left.year !== right.year) return left.year - right.year;
  return TERM_SEASONS.indexOf(left.season) - TERM_SEASONS.indexOf(right.season);
}

/** "2026 秋季学期" or "Fall 2026". */
/** "2026 秋季学期" 或 "Fall 2026"。 */
export function termLabel(key: TermKey): LocalizedText {
  const { year, season } = parseTerm(key);
  const label = TERM_SEASON_LABELS[season];
  return { zh: `${year} ${label.zh}`, en: `${label.en} ${year}` };
}

/** The previous, current and next two terms around a date, for the editor's term picker. */
/** 某日期前后的学期（上一个、当前与之后两个），供编辑者选择学期。 */
export function nearbyTerms(date: WallDate): TermKey[] {
  if (!isWallDate(date)) return [];
  const current = termOfDate(date);
  const { year, season } = parseTerm(current);
  const index = TERM_SEASONS.indexOf(season);
  const terms: TermKey[] = [];
  for (let offset = -1; offset <= 2; offset += 1) {
    const total = index + offset;
    const shiftYear = Math.floor(total / TERM_SEASONS.length);
    const seasonIndex = ((total % TERM_SEASONS.length) + TERM_SEASONS.length) % TERM_SEASONS.length;
    terms.push(termKey(year + shiftYear, TERM_SEASONS[seasonIndex] as TermSeason));
  }
  return terms;
}
