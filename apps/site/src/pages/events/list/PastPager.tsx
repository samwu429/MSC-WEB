import type { Locale } from '@msc-web/content';
import { t } from '../../i18n/strings';
import { EVENTS, pageStatus } from '../strings';
import { PAST_EVENTS_PAGE_SIZE } from './events-query';

/**
 * Previous and next links through past events shown a page at a time, on the events page and the Interest Classes
 * page. `href` gives the address of a page with the anchor of its list, so paging does not scroll the visitor back
 * above the upcoming events. A page beyond the end links back to the last real page.
 * 分页浏览往期活动的上一页与下一页链接，用于活动页面与 "兴趣课" 页面。`href` 给出某一页的地址并带上列表的锚点，
 * 翻页时访问者不必重新越过近期活动。超出末页的页面会链接回最后一个实际存在的页面。
 */
export function PastPager(props: { locale: Locale; label: string; page: number; total: number; href: (page: number) => string }) {
  const { locale, page } = props;
  const totalPages = Math.max(1, Math.ceil(props.total / PAST_EVENTS_PAGE_SIZE));
  const previous = page > 1 ? Math.min(page - 1, totalPages) : null;
  const next = page < totalPages ? page + 1 : null;
  if (previous === null && next === null) return null;
  return (
    <nav class="pager" aria-label={props.label}>
      {previous !== null && (
        <a class="btn btn--ghost btn--small" rel="prev" href={props.href(previous)}>
          {t(EVENTS, 'previousPage', locale)}
        </a>
      )}
      {page <= totalPages && <span class="muted small">{pageStatus(page, totalPages, locale)}</span>}
      {next !== null && (
        <a class="btn btn--ghost btn--small" rel="next" href={props.href(next)}>
          {t(EVENTS, 'nextPage', locale)}
        </a>
      )}
    </nav>
  );
}
