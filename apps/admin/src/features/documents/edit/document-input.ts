import { emptyText, torontoWallTime, wallDateOf, type SiteDocument, type SiteDocumentInput } from '@msc-web/content';

/**
 * A blank document dated today in Toronto rather than in UTC, so an upload late in the evening is not dated the
 * next day.
 * 空白文件的日期取多伦多当天而非 UTC 当天，因此晚间上传的文件不会被标成第二天。
 */
export function newDocumentInput(now: Date): SiteDocumentInput {
  return {
    category: 'constitution',
    title: emptyText(),
    mediaKey: '',
    publishedOn: wallDateOf(torontoWallTime(now)),
    visible: true,
    sortOrder: 0,
  };
}

export function documentInputOf(document: SiteDocument): SiteDocumentInput {
  return {
    category: document.category,
    title: document.title,
    mediaKey: document.mediaKey,
    publishedOn: document.publishedOn,
    visible: document.visible,
    sortOrder: document.sortOrder,
  };
}
