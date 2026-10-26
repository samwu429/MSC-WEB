import { courseSlug, type Course, type ReviewSessionDetail } from '@msc-web/content';
import type { PageContext } from '../context';
import { Bi, BiText } from '../components/common';
import { sitePath } from '../routing/paths';
import { SessionActions, SessionLabel, SessionWhen, sessionAnchor } from './session/SessionParts';

/** The address of a course page: /reviews/csc108h5. */
/** 课程页面的地址：/reviews/csc108h5。 */
export function courseHref(course: Pick<Course, 'code'>): string {
  return sitePath(`/reviews/${courseSlug(course.code)}`);
}

/**
 * A course with the sessions given, one row each. Materials are listed in full on the course page, so a row only
 * counts them and links to that session there.
 * 一门课程及传入的场次，每场一行。资料在课程页面上完整列出，因此这里只显示数量并链接到课程页面上的对应场次。
 */
export function CourseCard(props: { course: Course; sessions: ReviewSessionDetail[]; ctx: PageContext }) {
  const { course, sessions, ctx } = props;
  const href = courseHref(course);
  return (
    <article class="course">
      <div class="course__head">
        <h3>
          <a class="course__code" href={href}>
            {course.code}
          </a>
        </h3>
        <p class="course__title">
          <Bi text={course.title} />
        </p>
      </div>
      <BiText text={course.description} class="course__text" />
      <div class="course__sessions">
        {sessions.map((session) => (
          <div class="session-row">
            <div class="session-row__main">
              <SessionLabel session={session} ctx={ctx} />
              <SessionWhen session={session} ctx={ctx} />
            </div>
            <SessionActions session={session} ctx={ctx} materialsHref={`${href}#${sessionAnchor(session)}`} />
          </div>
        ))}
      </div>
    </article>
  );
}
