import { termLabel, type SiteEvent, type TermKey } from '@msc-web/content';
import type { CourseReviews } from '../../infrastructure/d1/public/reviews';
import type { PageContext } from '../context';
import type { PageMeta } from '../layout/Document';
import { EmptyState, PageHero, SectionHeading, txt } from '../components/common';
import { COMMON, t } from '../i18n/strings';
import { ACADEMIC_PAGE_PATHS, SECTION_PATHS, sitePath, withQuery } from '../routing/paths';
import { EventCard } from '../events/EventCard';
import { AcademicIntegrityNotice } from '../events/list/EventsListView';
import { CourseCard } from '../reviews/CourseCard';
import { REVIEWS } from '../reviews/strings';
import { NoUpcomingInterestClasses } from './InterestClassesPage';
import { ACADEMICS } from './strings';

const REVIEWS_ID = 'academic-reviews';
const INTEREST_CLASSES_ID = 'academic-interest-classes';
const TALKS_ID = 'academic-talks';

export interface AcademicsData {
  /** The current term, whose test reviews the page shows. */
  /** 当前学期，页面显示该学期的考前复习。 */
  term: TermKey;
  termCourses: CourseReviews[];
  /** The next few interest classes. */
  /** 接下来的几节兴趣课。 */
  interestClasses: SiteEvent[];
  /** Whether an interest class has been held yet, which decides what the page says when none is coming up. */
  /** 是否已经举办过兴趣课；没有即将开始的兴趣课时，页面据此决定显示的说明。 */
  interestClassesHeld: boolean;
}

export function academicsMeta(ctx: PageContext): PageMeta {
  return { title: t(COMMON, 'navAcademics', ctx.locale), description: t(ACADEMICS, 'heroLead', ctx.locale) };
}

/**
 * /academics, the section's own page. The two pages of the header dropdown come first, in its order: this term's test
 * reviews, then the next interest classes, each with a link to its own page. A closing band points to the
 * department's talks and workshops, which are ordinary academic events listed on the Events page. The academic
 * integrity notice in the hero covers all of them.
 * /academics，板块自身的页面。先按页眉下拉菜单的顺序展示其中两个页面：本学期的考前复习，然后是接下来的兴趣课，
 * 每部分都附有前往其页面的链接。最后一栏指向学术部的讲座与工作坊，它们是列在活动页面上的普通学术活动。
 * 页首的学术诚信说明适用于以上全部。
 */
export function AcademicsPage({ ctx, data }: { ctx: PageContext; data: AcademicsData }) {
  const { locale } = ctx;
  return (
    <>
      <PageHero eyebrow={t(REVIEWS, 'heroEyebrow', locale)} title={COMMON.navAcademics} lead={ACADEMICS.heroLead}>
        <AcademicIntegrityNotice />
      </PageHero>
      <section class="section" aria-labelledby={REVIEWS_ID}>
        <div class="container">
          <SectionHeading
            id={REVIEWS_ID}
            eyebrow={txt(termLabel(data.term), locale)}
            title={COMMON.navReviews}
            lead={ACADEMICS.reviewsLead}
            link={{ href: sitePath(ACADEMIC_PAGE_PATHS.reviews), label: t(ACADEMICS, 'allReviews', locale) }}
          />
          {data.termCourses.length > 0 ? (
            <div class="grid grid--2">
              {data.termCourses.map((entry) => (
                <CourseCard course={entry.course} sessions={entry.sessions} ctx={ctx} />
              ))}
            </div>
          ) : (
            <EmptyState title={REVIEWS.termEmptyTitle} text={REVIEWS.termEmptyText} />
          )}
        </div>
      </section>
      <section class="section section--alt" aria-labelledby={INTEREST_CLASSES_ID}>
        <div class="container">
          <SectionHeading
            id={INTEREST_CLASSES_ID}
            title={COMMON.navInterestClasses}
            lead={ACADEMICS.interestClassesLead}
            link={{ href: sitePath(ACADEMIC_PAGE_PATHS.interestClasses), label: t(ACADEMICS, 'allInterestClasses', locale) }}
          />
          {data.interestClasses.length > 0 ? (
            <div class="grid grid--3">
              {data.interestClasses.map((event) => (
                <EventCard event={event} ctx={ctx} />
              ))}
            </div>
          ) : (
            <NoUpcomingInterestClasses held={data.interestClassesHeld} />
          )}
        </div>
      </section>
      <section class="section section--tight" aria-labelledby={TALKS_ID}>
        <div class="container">
          <SectionHeading
            id={TALKS_ID}
            title={ACADEMICS.talksTitle}
            lead={ACADEMICS.talksLead}
            link={{ href: sitePath(withQuery(SECTION_PATHS.events, { type: 'academic' })), label: t(ACADEMICS, 'allAcademicEvents', locale) }}
          />
        </div>
      </section>
    </>
  );
}
