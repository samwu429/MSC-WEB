import { termLabel, type TermKey } from '@msc-web/content';
import type { CourseReviews } from '../../../infrastructure/d1/public/reviews';
import type { PageContext } from '../../context';
import { EmptyState, SectionHeading, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { SECTION_PATHS, localePath } from '../../routing/paths';
import { CourseCard } from '../../reviews/CourseCard';
import { HOME } from '../strings';

export function TermReviewsSection({ ctx, term, courses }: { ctx: PageContext; term: TermKey; courses: CourseReviews[] }) {
  const { locale } = ctx;
  return (
    <section class="section" aria-labelledby="home-reviews">
      <div class="container">
        <SectionHeading
          id="home-reviews"
          eyebrow={txt(termLabel(term), locale)}
          title={t(HOME, 'reviewsTitle', locale)}
          lead={t(HOME, 'reviewsLead', locale)}
          link={{ href: localePath(locale, SECTION_PATHS.reviews), label: t(HOME, 'reviewsLink', locale) }}
        />
        {courses.length > 0 ? (
          <div class="grid grid--2">
            {courses.map((entry) => (
              <CourseCard course={entry.course} sessions={entry.sessions} ctx={ctx} />
            ))}
          </div>
        ) : (
          <EmptyState title={t(HOME, 'reviewsEmptyTitle', locale)} text={t(HOME, 'reviewsEmptyText', locale)} />
        )}
      </div>
    </section>
  );
}
