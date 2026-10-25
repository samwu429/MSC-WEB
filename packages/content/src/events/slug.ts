import type { IssueCollector } from '../validation/issues';
import type { WallTime } from '../time/toronto';

/**
 * Event addresses look like /events/2026-10-mid-autumn-night. A slug is lowercase ASCII words joined by hyphens,
 * so links stay readable when shared in WeChat or on Instagram.
 * 活动地址形如 /events/2026-10-mid-autumn-night。slug 由小写 ASCII 单词和连字符组成，在微信或 Instagram 分享时仍然易读。
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const MAX_SLUG_LENGTH = 80;

export function isSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(value);
}

/** A word boundary is used only when it gives up at most this many characters; a very long word is cut where it stands. */
/** 只有在舍弃不超过这么多字符时才在单词边界截断；特别长的单词直接在限制处截断。 */
const MAX_WORD_BACKTRACK = 20;

/**
 * The longest prefix of a hyphenated slug within `limit` that ends at a whole word, or the hard cut when the last
 * word boundary is too far back. Never ends with a hyphen.
 * 不超过 `limit`、且以完整单词结尾的最长 slug 前缀；若最近的单词边界太靠前，则直接在限制处截断。结尾永远不是连字符。
 */
export function cutAtWord(slug: string, limit: number): string {
  if (slug.length <= limit) return slug;
  const lastBreak = slug.slice(0, limit + 1).lastIndexOf('-');
  const cut = lastBreak >= limit - MAX_WORD_BACKTRACK ? lastBreak : limit;
  return slug.slice(0, cut).replace(/-+$/g, '');
}

/** Room left for the words after the "YYYY-MM-" date prefix of an event slug. */
/** 活动 slug 中 "YYYY-MM-" 日期前缀之后留给单词的长度。 */
const WORDS_LIMIT = MAX_SLUG_LENGTH - 8;

/**
 * Lowercase ASCII words from free text; characters outside a-z and 0-9 become separators. A long title is cut at
 * the last whole word that fits, so a link never ends in half a word.
 * 从任意文字中取出小写 ASCII 单词；a-z 与 0-9 以外的字符都视为分隔符。过长的标题会在能放下的最后一个完整单词处截断，
 * 因此链接不会以半个单词结尾。
 */
export function slugify(text: string): string {
  const words = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cutAtWord(words, WORDS_LIMIT);
}

/**
 * A slug for a new event: year and month first so slugs sort by date, then the English title. A Chinese-only
 * title yields just the date, and the caller adds a short suffix when that is already taken.
 * 新活动的 slug：先写年和月，使 slug 按日期排序，然后是英文标题。只有中文标题时只得到日期，若已被占用，由调用方追加简短后缀。
 */
export function suggestEventSlug(englishTitle: string, startsAt: WallTime): string {
  const month = startsAt.slice(0, 7);
  const words = slugify(englishTitle);
  return words ? `${month}-${words}` : month;
}

/** An optional slug from an editor. Empty means "derive one". */
/** 编辑者填写的可选 slug。留空表示由系统生成。 */
export function readSlug(issues: IssueCollector, value: unknown, field: string): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return '';
    if (isSlug(trimmed)) return trimmed;
  }
  issues.add(field, `链接名只能包含小写字母、数字和连字符，最多 ${MAX_SLUG_LENGTH} 个字符`);
  return '';
}
