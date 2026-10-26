import { materialLabel, mediaUrl, termLabel, type Course, type Locale, type ReviewMaterial, type ReviewSessionDetail } from '@msc-web/content';
import type { PageContext } from '../../context';
import type { PageMeta } from '../../layout/Document';
import { Bi, BiRichText, BiText, EmptyState, MetaItem, SectionHeading, fallbackLang, txt } from '../../components/common';
import { Icon } from '../../components/Icon';
import { t } from '../../i18n/strings';
import { sitePath } from '../../routing/paths';
import { groupSessionsByTerm } from '../review-terms';
import { SessionActions, SessionLabel, SessionWhen, sessionAnchor } from '../session/SessionParts';
import { REVIEWS, courseDescription, presentersLine } from '../strings';

/** An uploaded PDF opens from the media store; a link opens the outside page in a new tab. */
/** 上传的 PDF 从媒体库打开；链接在新标签页中打开站外页面。 */
function MaterialLink({ material, locale }: { material: ReviewMaterial; locale: Locale }) {
  const text = materialLabel(material);
  const label = txt(text, locale);
  const lang = fallbackLang(text, locale);
  if (material.mediaKey) {
    return (
      <a class="material" href={mediaUrl(material.mediaKey)} type="application/pdf" lang={lang}>
        <Icon name="download" />
        {label}
      </a>
    );
  }
  if (!material.url) return null;
  return (
    <a class="material" href={material.url} target="_blank" rel="noopener noreferrer" lang={lang}>
      <Icon name="external" />
      {label}
    </a>
  );
}

/** One session in full. Its id is the anchor that course cards link to for materials. */
/** 一场复习的完整信息。其 id 是课程卡片链接资料时使用的锚点。 */
function SessionBlock({ session, ctx, ended }: { session: ReviewSessionDetail; ctx: PageContext; ended: boolean }) {
  const { locale } = ctx;
  const anchor = sessionAnchor(session);
  const headingId = `${anchor}-title`;
  return (
    <article class="session-row" id={anchor} aria-labelledby={headingId}>
      <div class="session-row__main">
        <SessionLabel session={session} ctx={ctx} headingId={headingId} />
        <SessionWhen session={session} ctx={ctx} />
        {session.presenters && <MetaItem icon="users" text={presentersLine(session.presenters, locale)} />}
        <BiRichText text={session.notes} />
        {session.materials.length > 0 && (
          <div class="materials" role="group" aria-label={t(REVIEWS, 'materials', locale)}>
            {session.materials.map((material) => (
              <MaterialLink material={material} locale={locale} />
            ))}
          </div>
        )}
      </div>
      <SessionActions session={session} ctx={ctx} ended={ended} />
    </article>
  );
}

export function courseMeta(course: Course, ctx: PageContext): PageMeta {
  const title = txt(course.title, ctx.locale);
  return { title: title ? `${course.code} ${title}` : course.code, description: courseDescription(course.code, title, ctx.locale) };
}

/**
 * A course page: every published session of the course, grouped by term with the newest term first.
 * 课程页面：该课程的全部已发布场次，按学期分组，最新的学期在前。
 */
export function CourseView({ ctx, course, sessions }: { ctx: PageContext; course: Course; sessions: ReviewSessionDetail[] }) {
  const { locale } = ctx;
  const title = txt(course.title, locale);
  const groups = groupSessionsByTerm(sessions);
  return (
    <>
      <header class="page-hero">
        <div class="container">
          <a class="backlink" href={sitePath('/reviews')}>
            <Icon name="arrow" />
            {t(REVIEWS, 'backToReviews', locale)}
          </a>
          <div class="eyebrow">{t(REVIEWS, 'courseEyebrow', locale)}</div>
          <h1 class="page-hero__title">{course.code}</h1>
          {title && (
            <p class="page-hero__lead">
              <strong>
                <Bi text={course.title} />
              </strong>
            </p>
          )}
          <BiRichText text={course.description} class="prose page-hero__lead" />
          {course.archived && (
            <div class="notice" role="note">
              <Icon name="calendar" />
              <div>
                <strong>
                  <Bi text={REVIEWS.courseEndedTitle} />
                </strong>
                <BiText text={REVIEWS.courseEndedText} />
              </div>
            </div>
          )}
        </div>
      </header>
      {groups.length > 0 ? (
        groups.map((group, index) => {
          const headingId = `term-${group.term}`;
          return (
            <section class={index % 2 === 1 ? 'section section--tight section--alt' : 'section section--tight'} aria-labelledby={headingId}>
              <div class="container">
                <SectionHeading id={headingId} title={termLabel(group.term)} />
                <div class="course">
                  <div class="course__sessions">
                    {group.sessions.map((session) => (
                      <SessionBlock session={session} ctx={ctx} ended={course.archived} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })
      ) : (
        <div class="section">
          <div class="container">
            <EmptyState title={REVIEWS.courseEmptyTitle} text={REVIEWS.courseEmptyText} />
          </div>
        </div>
      )}
    </>
  );
}
