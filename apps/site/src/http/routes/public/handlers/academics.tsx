import { termOfDate, torontoWallTime, wallDateOf } from '@msc-web/content';
import { countPastInterestClasses, listPastInterestClasses, listUpcomingInterestClasses } from '../../../../infrastructure/d1/public/events';
import { listTermCourseReviews } from '../../../../infrastructure/d1/public/reviews';
import { AcademicsPage, academicsMeta } from '../../../../pages/academics/AcademicsPage';
import { InterestClassesPage, interestClassesMeta } from '../../../../pages/academics/InterestClassesPage';
import { loadPageContext } from '../../../../pages/context';
import { PAST_EVENTS_PAGE_SIZE, readPageNumber } from '../../../../pages/events/list/events-query';
import { renderPage } from '../../../../pages/render';
import type { PageHandler } from '../page-handler';

/** Interest classes on /academics; the rest are one click away on /interest-classes. */
/** /academics 上显示的兴趣课数量；其余的在 /interest-classes 上，只需点击一次。 */
const ACADEMICS_INTEREST_CLASS_LIMIT = 3;

/**
 * /academics: this term's test reviews and the next interest classes. One instant drives the page context and the
 * queries, as on the home page, so "this term" and "upcoming" agree with the status the cards show.
 * /academics：本学期的考前复习与接下来的兴趣课。与首页一样，页面上下文与各查询使用同一时刻，因此 "本学期" 与 "即将开始"
 * 与卡片显示的状态一致。
 */
export const academicsPage: PageHandler = async (c, locale) => {
  const db = c.env.DB;
  const now = new Date();
  const wallNow = torontoWallTime(now);
  const term = termOfDate(wallDateOf(wallNow));
  const [ctx, termCourses, interestClasses, pastInterestClasses] = await Promise.all([
    loadPageContext(c, locale, now),
    listTermCourseReviews(db, term),
    listUpcomingInterestClasses(db, wallNow, { limit: ACADEMICS_INTEREST_CLASS_LIMIT }),
    countPastInterestClasses(db, wallNow),
  ]);
  const data = { term, termCourses, interestClasses, interestClassesHeld: pastInterestClasses > 0 };
  return renderPage(c, ctx, academicsMeta(ctx), <AcademicsPage ctx={ctx} data={data} />);
};

/** /interest-classes: every upcoming interest class, and the past ones a page at a time (?page=N). */
/** /interest-classes：全部即将开始的兴趣课，以及分页显示的往期兴趣课（?page=N）。 */
export const interestClassesPage: PageHandler = async (c, locale) => {
  const page = readPageNumber(c.req.query('page'));
  const ctx = await loadPageContext(c, locale);
  const [upcoming, past] = await Promise.all([
    listUpcomingInterestClasses(c.env.DB, ctx.now),
    listPastInterestClasses(c.env.DB, ctx.now, { page, pageSize: PAST_EVENTS_PAGE_SIZE }),
  ]);
  const data = { page, upcoming, past: past.events, pastTotal: past.total };
  return renderPage(c, ctx, interestClassesMeta(ctx), <InterestClassesPage ctx={ctx} data={data} />);
};
