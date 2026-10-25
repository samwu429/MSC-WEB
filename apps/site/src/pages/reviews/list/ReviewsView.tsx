import { termLabel, type Course, type ReviewSessionDetail, type TermKey } from '@msc-web/content';
import type { PageContext } from '../../context';
import type { PageMeta } from '../../layout/Document';
import { EmptyState, PageHero, SectionHeading, fallbackLang, txt } from '../../components/common';
import { Icon } from '../../components/Icon';
import { COMMON, t } from '../../i18n/strings';
import { localePath, withQuery } from '../../routing/paths';
import { CourseCard, courseHref } from '../CourseCard';
import { REVIEWS } from '../strings';

const TERM_ID = 'term-reviews';
const ALL_COURSES_ID = 'all-courses';

export interface ReviewsData {
  /** Term tabs, newest first. */
  /** 学期标签，按从新到旧排列。 */
  terms: TermKey[];
  selected: TermKey;
  current: TermKey;
  termCourses: { course: Course; sessions: ReviewSessionDetail[] }[];
  allCourses: Course[];
}

/** The current term is the plain /reviews address; other terms carry ?term=. */
/** 当前学期使用不带参数的 /reviews 地址；其他学期带 ?term= 参数。 */
function termHref(ctx: PageContext, term: TermKey, current: TermKey): string {
  return localePath(ctx.locale, withQuery('/reviews', { term: term === current ? null : term }));
}

function TermTabs({ ctx, data }: { ctx: PageContext; data: ReviewsData }) {
  const { locale } = ctx;
  return (
    <nav class="tabs" aria-label={t(REVIEWS, 'termTabsLabel', locale)}>
      {data.terms.map((term) => (
        <a class="tab" href={termHref(ctx, term, data.current)} aria-current={term === data.selected ? 'page' : undefined}>
          {txt(termLabel(term), locale)}
        </a>
      ))}
    </nav>
  );
}

/**
 * Constitution Article 2.3: reviews are study aids and never graded work done for others. It sits in the page hero
 * under the lead.
 * 章程第 2.3 条：复习是学习辅助，绝不替他人完成计分作业。它位于页首导语之下。
 */
function IntegrityNotice({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  return (
    <div class="notice notice--integrity" role="note">
      <Icon name="shield" />
      <p>
        <strong>{t(REVIEWS, 'integrityTitle', locale)}</strong> {t(REVIEWS, 'integrityText', locale)}
      </p>
    </div>
  );
}

export function reviewsMeta(ctx: PageContext): PageMeta {
  return { title: t(COMMON, 'navReviews', ctx.locale), description: t(REVIEWS, 'heroLead', ctx.locale) };
}

export function ReviewsView({ ctx, data }: { ctx: PageContext; data: ReviewsData }) {
  const { locale } = ctx;
  return (
    <>
      <PageHero eyebrow={t(REVIEWS, 'heroEyebrow', locale)} title={t(COMMON, 'navReviews', locale)} lead={t(REVIEWS, 'heroLead', locale)}>
        <IntegrityNotice ctx={ctx} />
        <TermTabs ctx={ctx} data={data} />
      </PageHero>
      <section class="section" aria-labelledby={TERM_ID}>
        <div class="container">
          <SectionHeading
            id={TERM_ID}
            title={txt(termLabel(data.selected), locale)}
            lead={t(REVIEWS, data.selected === data.current ? 'termLead' : 'otherTermLead', locale)}
          />
          {data.termCourses.length > 0 ? (
            <div class="grid grid--2">
              {data.termCourses.map((entry) => (
                <CourseCard course={entry.course} sessions={entry.sessions} ctx={ctx} />
              ))}
            </div>
          ) : (
            <EmptyState title={t(REVIEWS, 'termEmptyTitle', locale)} text={t(REVIEWS, 'termEmptyText', locale)} />
          )}
        </div>
      </section>
      <section class="section section--alt" aria-labelledby={ALL_COURSES_ID}>
        <div class="container">
          <SectionHeading id={ALL_COURSES_ID} title={t(REVIEWS, 'allCoursesTitle', locale)} lead={t(REVIEWS, 'allCoursesLead', locale)} />
          {data.allCourses.length > 0 ? (
            <ul class="doc-list grid--3">
              {data.allCourses.map((course) => (
                <li class="doc-item">
                  <span class="doc-item__icon">
                    <Icon name="book" />
                  </span>
                  <div class="doc-item__body">
                    <a class="doc-item__title" href={courseHref(course, ctx)}>
                      {course.code}
                    </a>
                    <span class="doc-item__meta" lang={fallbackLang(course.title, locale)}>
                      {txt(course.title, locale)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t(REVIEWS, 'allCoursesEmpty', locale)} />
          )}
        </div>
      </section>
    </>
  );
}
