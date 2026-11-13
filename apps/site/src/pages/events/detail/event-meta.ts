import { isInterestClass, mediaUrl, pickText, type Locale, type SiteEvent } from '@msc-web/content';
import type { PageMeta } from '../../layout/Document';
import { t } from '../../i18n/strings';
import { ACADEMIC_PAGE_PATHS } from '../../routing/paths';
import { EVENTS } from '../strings';

/** Search engines show about this many characters of a description. */
/** 搜索引擎大约显示描述中的这么多字符。 */
export const DESCRIPTION_LENGTH = 160;

/** The opening of a text on one line, cut at a whole character with an ellipsis when it is longer than `max`. */
/** 将文字开头合并为一行；超过 `max` 时在完整字符处截断并加省略号。 */
export function excerpt(text: string, max: number): string {
  const line = text.replace(/\s+/g, ' ').trim();
  const characters = Array.from(line);
  if (characters.length <= max) return line;
  return `${characters.slice(0, max - 1).join('').trimEnd()}…`;
}

/** The summary, or else the opening of the body, or else the events page introduction. */
/** 优先使用简介，其次使用正文开头，最后使用活动页面的介绍。 */
export function eventDescription(event: Pick<SiteEvent, 'summary' | 'body'>, locale: Locale): string {
  return excerpt(pickText(event.summary, locale), DESCRIPTION_LENGTH) || excerpt(pickText(event.body, locale), DESCRIPTION_LENGTH) || t(EVENTS, 'heroLead', locale);
}

/**
 * The meta of an event's page. An interest class keeps its address under /events, where the events page links it,
 * but the header places it under Academic Activities → Interest Classes, where its back link leads.
 * 活动页面的元信息。兴趣课的地址仍在 /events 之下，活动页面也链接到那里；但页眉把它放在「学术活动 → 兴趣课」之下，与其返回链接一致。
 */
export function eventDetailMeta(event: SiteEvent, locale: Locale): PageMeta {
  return {
    title: pickText(event.title, locale),
    description: eventDescription(event, locale),
    image: event.coverKey ? mediaUrl(event.coverKey) : undefined,
    navPath: isInterestClass(event) ? `${ACADEMIC_PAGE_PATHS.interestClasses}/${event.slug}` : undefined,
  };
}
