import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, type EventCategory, type SiteEvent } from '@msc-web/content';
import type { PageContext } from '../../context';
import type { PageMeta } from '../../layout/Document';
import { Bi, BiText, CodeOfBehaviourLink, EmptyState, PageHero, SectionHeading, txt } from '../../components/common';
import { Icon } from '../../components/Icon';
import { COMMON, t } from '../../i18n/strings';
import { sitePath, withQuery } from '../../routing/paths';
import { EventCard, PastEventList } from '../EventCard';
import { EVENTS } from '../strings';
import type { EventsQuery } from './events-query';
import { PastPager } from './PastPager';

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
  return sitePath(withQuery('/events', { type: category, page: page > 1 ? page : null }));
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

/** The pager of past events keeps the category. */
/** 往期活动的分页保留所选类别。 */
function Pager({ ctx, query, pastTotal }: { ctx: PageContext; query: EventsQuery; pastTotal: number }) {
  return (
    <PastPager
      locale={ctx.locale}
      label={t(EVENTS, 'pagerLabel', ctx.locale)}
      page={query.page}
      total={pastTotal}
      href={(page) => `${listHref(ctx, query.category, page)}#${PAST_ID}`}
    />
  );
}

/** On the Academic tab and the Academic Activities page: the Group's academic activities follow the University's Code. */
/** 学术活动标签页与 "学术活动" 页面上：联盟的学术活动遵守学校的守则。 */
export function AcademicIntegrityNotice() {
  return (
    <div class="notice notice--integrity" role="note">
      <Icon name="shield" />
      <div>
        <strong>
          <Bi text={EVENTS.integrityTitle} />
        </strong>
        <BiText text={EVENTS.integrityText} />
        <CodeOfBehaviourLink />
      </div>
    </div>
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
      <PageHero eyebrow={t(EVENTS, 'heroEyebrow', locale)} title={COMMON.navEvents} lead={EVENTS.heroLead}>
        {query.category === 'academic' && <AcademicIntegrityNotice />}
        <CategoryTabs ctx={ctx} active={query.category} />
      </PageHero>
      <section class="section" aria-labelledby={UPCOMING_ID}>
        <div class="container">
          <SectionHeading id={UPCOMING_ID} title={EVENTS.upcomingTitle} lead={EVENTS.upcomingLead} />
          {data.upcoming.length > 0 ? (
            <EventGrid ctx={ctx} events={data.upcoming} />
          ) : (
            <EmptyState title={EVENTS.upcomingEmptyTitle} text={EVENTS.upcomingEmptyText} />
          )}
        </div>
      </section>
      <section class="section section--alt section--tight" aria-labelledby={PAST_ID}>
        <div class="container">
          <SectionHeading id={PAST_ID} title={EVENTS.pastTitle} lead={EVENTS.pastLead} />
          {data.past.length > 0 ? (
            <PastEventList ctx={ctx} events={data.past} />
          ) : query.page > 1 ? (
            <EmptyState title={EVENTS.pageEmptyTitle} text={EVENTS.pageEmptyText} />
          ) : (
            <EmptyState title={EVENTS.pastEmptyTitle} />
          )}
          <Pager ctx={ctx} query={query} pastTotal={data.pastTotal} />
        </div>
      </section>
    </>
  );
}
