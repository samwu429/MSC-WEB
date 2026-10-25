import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, type EventCategory, type SiteEvent } from '@msc-web/content';
import type { PageContext } from '../../context';
import type { PageMeta } from '../../layout/Document';
import { EmptyState, PageHero, SectionHeading, txt } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { localePath, withQuery } from '../../routing/paths';
import { EventCard } from '../EventCard';
import { EVENTS, pageStatus } from '../strings';
import { PAST_EVENTS_PAGE_SIZE, type EventsQuery } from './events-query';

const UPCOMING_ID = 'upcoming-events';
const PAST_ID = 'past-events';

export interface EventsListData {
  query: EventsQuery;
  upcoming: SiteEvent[];
  past: SiteEvent[];
  pastTotal: number;
}

/** The list address for a category and page; the first page and "all" leave their parameters out. */
/** 某类别与页码对应的列表地址；第一页与 "全部" 不带对应参数。 */
function listHref(ctx: PageContext, category: EventCategory | null, page = 1): string {
  return localePath(ctx.locale, withQuery('/events', { type: category, page: page > 1 ? page : null }));
}

function CategoryTabs({ ctx, active }: { ctx: PageContext; active: EventCategory | null }) {
  const { locale } = ctx;
  return (
    <nav class="tabs" aria-label={t(EVENTS, 'categoryTabsLabel', locale)}>
      {[null, ...EVENT_CATEGORIES].map((category) => (
        <a class="tab" href={listHref(ctx, category)} aria-current={category === active ? 'page' : undefined}>
          {category ? txt(EVENT_CATEGORY_LABELS[category], locale) : t(EVENTS, 'allCategories', locale)}
        </a>
      ))}
    </nav>
  );
}

function EventGrid({ ctx, events }: { ctx: PageContext; events: SiteEvent[] }) {
  return (
    <div class="grid grid--3">
      {events.map((event) => (
        <EventCard event={event} ctx={ctx} />
      ))}
    </div>
  );
}

/**
 * Previous and next links for past events. They keep the category and jump to the past section, so paging does
 * not scroll the visitor back above the upcoming events. A page beyond the end links back to the last real page.
 * 往期活动的上一页与下一页链接。链接保留类别并跳转到往期板块，翻页时访问者不必重新越过近期活动。
 * 超出末页的页面会链接回最后一个实际存在的页面。
 */
function Pager({ ctx, query, pastTotal }: { ctx: PageContext; query: EventsQuery; pastTotal: number }) {
  const { locale } = ctx;
  const totalPages = Math.max(1, Math.ceil(pastTotal / PAST_EVENTS_PAGE_SIZE));
  const previous = query.page > 1 ? Math.min(query.page - 1, totalPages) : null;
  const next = query.page < totalPages ? query.page + 1 : null;
  if (previous === null && next === null) return null;
  return (
    <nav class="pager" aria-label={t(EVENTS, 'pagerLabel', locale)}>
      {previous !== null && (
        <a class="btn btn--ghost btn--small" rel="prev" href={`${listHref(ctx, query.category, previous)}#${PAST_ID}`}>
          {t(EVENTS, 'previousPage', locale)}
        </a>
      )}
      {query.page <= totalPages && <span class="muted small">{pageStatus(query.page, totalPages, locale)}</span>}
      {next !== null && (
        <a class="btn btn--ghost btn--small" rel="next" href={`${listHref(ctx, query.category, next)}#${PAST_ID}`}>
          {t(EVENTS, 'nextPage', locale)}
        </a>
      )}
    </nav>
  );
}

export function eventsListMeta(ctx: PageContext): PageMeta {
  return { title: t(COMMON, 'navEvents', ctx.locale), description: t(EVENTS, 'heroLead', ctx.locale) };
}

export function EventsListView({ ctx, data }: { ctx: PageContext; data: EventsListData }) {
  const { locale } = ctx;
  const { query } = data;
  return (
    <>
      <PageHero eyebrow={t(EVENTS, 'heroEyebrow', locale)} title={t(COMMON, 'navEvents', locale)} lead={t(EVENTS, 'heroLead', locale)}>
        <CategoryTabs ctx={ctx} active={query.category} />
      </PageHero>
      <section class="section" aria-labelledby={UPCOMING_ID}>
        <div class="container">
          <SectionHeading id={UPCOMING_ID} title={t(EVENTS, 'upcomingTitle', locale)} lead={t(EVENTS, 'upcomingLead', locale)} />
          {data.upcoming.length > 0 ? (
            <EventGrid ctx={ctx} events={data.upcoming} />
          ) : (
            <EmptyState title={t(EVENTS, 'upcomingEmptyTitle', locale)} text={t(EVENTS, 'upcomingEmptyText', locale)} />
          )}
        </div>
      </section>
      <section class="section section--alt" aria-labelledby={PAST_ID}>
        <div class="container">
          <SectionHeading id={PAST_ID} title={t(EVENTS, 'pastTitle', locale)} lead={t(EVENTS, 'pastLead', locale)} />
          {data.past.length > 0 ? (
            <EventGrid ctx={ctx} events={data.past} />
          ) : query.page > 1 ? (
            <EmptyState title={t(EVENTS, 'pageEmptyTitle', locale)} text={t(EVENTS, 'pageEmptyText', locale)} />
          ) : (
            <EmptyState title={t(EVENTS, 'pastEmptyTitle', locale)} />
          )}
          <Pager ctx={ctx} query={query} pastTotal={data.pastTotal} />
        </div>
      </section>
    </>
  );
}
