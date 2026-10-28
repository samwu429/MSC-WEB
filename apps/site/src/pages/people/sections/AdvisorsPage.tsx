import type { PageContext } from '../../context';
import { PEOPLE_TITLE_ID, PeopleSectionHero } from '../layout/PeopleSectionHero';
import type { PeopleRoster } from '../roster';
import { AdvisorCards } from './groups';

/** /people/advisors: the visible Honorary Advisors, or a note that they will be announced. */
/** /people/advisors：正在显示的荣誉顾问；尚无人时显示即将公布的说明。 */
export function AdvisorsPage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  return (
    <>
      <PeopleSectionHero ctx={ctx} view="advisors" />
      <section class="section" aria-labelledby={PEOPLE_TITLE_ID}>
        <div class="container">
          <AdvisorCards roster={roster} locale={ctx.locale} headingLevel={2} />
        </div>
      </section>
    </>
  );
}
