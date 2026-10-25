import { MAX_SLUG_LENGTH, cutAtWord } from '@msc-web/content';

/**
 * Room kept at the end of a long base slug for a numeric suffix, so a numbered slug never exceeds MAX_SLUG_LENGTH
 * and still passes the slug validator when the editor saves the event again.
 * 为数字后缀在较长的基础 slug 末尾预留的空间，使带编号的 slug 不会超过 MAX_SLUG_LENGTH，编辑者再次保存活动时仍能通过校验。
 */
const SUFFIX_ROOM = 8;

/**
 * The text every candidate for `base` begins with: `base` itself, shortened only when a suffix would not fit.
 * Taken slugs are looked up with this as the prefix, so one query finds every candidate already in use.
 * `base` 的每个候选 slug 都以它开头：即 `base` 本身，只有在放不下后缀时才会缩短。以它为前缀查询已占用的 slug，一次查询即可找到所有已被使用的候选。
 */
export function slugStem(base: string): string {
  return cutAtWord(base, MAX_SLUG_LENGTH - SUFFIX_ROOM);
}

/** `base` when free, otherwise the first free one of stem-2, stem-3 and so on. */
/** `base` 未被占用时直接使用，否则依次尝试 stem-2、stem-3 等，取第一个未被占用的。 */
export function firstFreeSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  const stem = slugStem(base);
  let number = 2;
  while (used.has(`${stem}-${number}`)) number += 1;
  return `${stem}-${number}`;
}
