import { courseSlug, isCourseCode, termOfDate, wallDateOf } from '@msc-web/content';
import {
  findVisibleCourse,
  listCourseSessions,
  listPublishedTerms,
  listReviewedCourses,
  listTermCourseReviews,
} from '../../../../infrastructure/d1/public/reviews';
import { loadPageContext } from '../../../../pages/context';
import { renderNotFound } from '../../../../pages/errors/ErrorPages';
import { renderPage } from '../../../../pages/render';
import { CourseView, courseMeta } from '../../../../pages/reviews/course/CourseView';
import { ReviewsView, reviewsMeta } from '../../../../pages/reviews/list/ReviewsView';
import { selectTerm, termTabs } from '../../../../pages/reviews/review-terms';
import { sitePath } from '../../../../pages/routing/paths';
import type { PageHandler } from '../page-handler';

export const reviewsPage: PageHandler = async (c, locale) => {
  const [ctx, publishedTerms, allCourses] = await Promise.all([loadPageContext(c, locale), listPublishedTerms(c.env.DB), listReviewedCourses(c.env.DB)]);
  const current = termOfDate(wallDateOf(ctx.now));
  const terms = termTabs(publishedTerms, current);
  const selected = selectTerm(c.req.query('term'), terms, current);
  const termCourses = await listTermCourseReviews(c.env.DB, selected);
  const data = { terms, selected, current, termCourses, allCourses };
  return renderPage(c, ctx, reviewsMeta(ctx), <ReviewsView ctx={ctx} data={data} />);
};

/**
 * Course pages live at the lowercase code. Any other casing of a valid code redirects there, so each course has one
 * address.
 * 课程页面位于小写课程代码的地址。有效代码的其他大小写形式都会跳转到那里，因此每门课程只有一个地址。
 */
export const coursePage: PageHandler = async (c, locale) => {
  const segment = c.req.param('course') ?? '';
  const code = segment.toUpperCase();
  if (!isCourseCode(code)) return renderNotFound(c);
  if (segment !== courseSlug(code)) return c.redirect(sitePath(`/reviews/${courseSlug(code)}`), 301);
  const course = await findVisibleCourse(c.env.DB, code);
  if (!course) return renderNotFound(c);
  const [ctx, sessions] = await Promise.all([loadPageContext(c, locale), listCourseSessions(c.env.DB, course.id)]);
  return renderPage(c, ctx, courseMeta(course, ctx), <CourseView ctx={ctx} course={course} sessions={sessions} />);
};
