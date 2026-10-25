/**
 * The site speaks Chinese and English. Chinese is the default and lives at the root; English lives under /en.
 * Every piece of editable text is stored in both languages, and either side may be left empty.
 * 网站使用中文和英文。中文为默认语言，位于根路径；英文位于 /en 之下。每段可编辑的文字都以两种语言保存，任意一边都可以留空。
 */

export const LOCALES = ['zh', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/** Text in both languages. An empty side falls back to the other one when shown. */
/** 两种语言的文字。显示时，空的一边会改用另一边。 */
export interface LocalizedText {
  zh: string;
  en: string;
}

export function emptyText(): LocalizedText {
  return { zh: '', en: '' };
}

/** The text for a locale, or the other language when that side is empty. */
/** 指定语言的文字；该语言为空时返回另一种语言。 */
export function pickText(text: LocalizedText, locale: Locale): string {
  const preferred = locale === 'zh' ? text.zh : text.en;
  if (preferred.trim()) return preferred;
  return locale === 'zh' ? text.en : text.zh;
}

/** Whether at least one language has visible text. */
/** 至少一种语言有可见文字。 */
export function hasText(text: LocalizedText): boolean {
  return text.zh.trim() !== '' || text.en.trim() !== '';
}

/** The BCP 47 tag for the html lang attribute and date formatting. */
/** 用于 html lang 属性与日期格式化的 BCP 47 语言标签。 */
export function localeTag(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-CA';
}
