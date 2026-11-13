import type { SiteEvent } from '@msc-web/content';
import type { PageContext } from '../context';
import type { PageMeta } from '../layout/Document';
import { Bi, BiText, CodeOfBehaviourLink, EmptyState, PageHero, SectionHeading } from '../components/common';
import { Icon } from '../components/Icon';
import { COMMON, t } from '../i18n/strings';
import { ACADEMIC_PAGE_PATHS, sitePath, withQuery } from '../routing/paths';
import { EventCard, PastEventList } from '../events/EventCard';
import { PastPager } from '../events/list/PastPager';
import { EVENTS } from '../events/strings';
import { REVIEWS } from '../reviews/strings';
import { ACADEMICS } from './strings';

const UPCOMING_ID = 'upcoming-classes';
const PAST_ID = 'past-classes';

export interface InterestClassesData {
  /** The page of past classes, from 1. */
  /** 往期兴趣课的页码，从 1 开始。 */
  page: number;
  upcoming: SiteEvent[];
  past: SiteEvent[];
  /** Past classes across every page; none means no class has been held yet. */
  /** 所有页中往期兴趣课的总数；为零表示还没有举办过兴趣课。 */
  pastTotal: number;
}

/**
 * In the page hero: interest classes follow no course and are not tutoring, so they never touch graded work; help
 * with a course before a test is under Test Reviews.
 * 位于页首：兴趣课不跟随任何课程，也不是课程辅导，因此从不涉及计入成绩的作业；考前针对课程的帮助请看考前复习。
 */
function NotTiedNotice() {
  return (
    <div class="notice notice--integrity" role="note">
      <Icon name="shield" />
      <div>
        <strong>
          <Bi text={ACADEMICS.notTiedTitle} />
        </strong>
        <BiText text={ACADEMICS.notTiedText} />
        <div class="notice__links">
          <a class="doc-link" href={sitePath(ACADEMIC_PAGE_PATHS.reviews)}>
            <Icon name="arrow" />
            <span>
              <Bi text={ACADEMICS.seeReviews} />
            </span>
          </a>
          <CodeOfBehaviourLink />
        </div>
      </div>
    </div>
  );
}

/**
 * No interest class is coming up. Before the first one the page says the first classes are on their way; once some
 * have been held, that there are none right now.
 * 没有即将开始的兴趣课。第一节课之前，页面说明第一批兴趣课即将推出；举办过之后，则说明暂时没有。
 */
export function NoUpcomingInterestClasses({ held }: { held: boolean }) {
  return held ? (
    <EmptyState title={ACADEMICS.noneUpcomingTitle} text={ACADEMICS.noneUpcomingText} />
  ) : (
    <EmptyState title={ACADEMICS.firstComingTitle} text={ACADEMICS.firstComingText} />
  );
}

/** The address of a page of past classes, jumping to their list; the first page leaves its number out. */
/** 往期兴趣课某一页的地址，并跳转到其列表；第一页不带页码。 */
function pastHref(page: number): string {
  return `${sitePath(withQuery(ACADEMIC_PAGE_PATHS.interestClasses, { page: page > 1 ? page : null }))}#${PAST_ID}`;
}

export function interestClassesMeta(ctx: PageContext): PageMeta {
  return { title: t(COMMON, 'navInterestClasses', ctx.locale), description: t(ACADEMICS, 'interestHeroLead', ctx.locale) };
}

/**
 * /interest-classes: the upcoming classes as cards, then the past ones as a compact list a page at a time. The past
 * list appears once a class has been held.
 * /interest-classes：近期兴趣课以卡片显示，往期兴趣课以紧凑列表分页显示。举办过兴趣课之后才会出现往期列表。
 */
export function InterestClassesPage({ ctx, data }: { ctx: PageContext; data: InterestClassesData }) {
  const { locale } = ctx;
  const held = data.pastTotal > 0;
  return (
    <>
      <PageHero eyebrow={t(REVIEWS, 'heroEyebrow', locale)} title={COMMON.navInterestClasses} lead={ACADEMICS.interestHeroLead}>
        <NotTiedNotice />
      </PageHero>
      <section class="section" aria-labelledby={UPCOMING_ID}>
        <div class="container">
          <SectionHeading id={UPCOMING_ID} title={ACADEMICS.upcomingTitle} />
          {data.upcoming.length > 0 ? (
            <div class="grid grid--3">
              {data.upcoming.map((event) => (
                <EventCard event={event} ctx={ctx} />
              ))}
            </div>
          ) : (
            <NoUpcomingInterestClasses held={held} />
          )}
        </div>
      </section>
      {held && (
        <section class="section section--alt section--tight" aria-labelledby={PAST_ID}>
          <div class="container">
            <SectionHeading id={PAST_ID} title={ACADEMICS.pastTitle} />
            {data.past.length > 0 ? (
              <PastEventList ctx={ctx} events={data.past} showKind={false} />
            ) : (
              <EmptyState title={ACADEMICS.pageEmptyTitle} text={EVENTS.pageEmptyText} />
            )}
            <PastPager locale={locale} label={t(ACADEMICS, 'pagerLabel', locale)} page={data.page} total={data.pastTotal} href={pastHref} />
          </div>
        </section>
      )}
    </>
  );
}
