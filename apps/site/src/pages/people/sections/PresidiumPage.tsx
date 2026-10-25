import type { PageContext } from '../../context';
import { PEOPLE_TITLE_ID, PeopleSectionHero } from '../layout/PeopleSectionHero';
import { PresidiumCards } from '../PresidiumCards';
import type { PeopleRoster } from '../roster';

/** /people/presidium: the four Presidium offices, each with its holder or its duties while vacant. */
/** /people/presidium：四个主席团职位，每个职位显示担任者；空缺时显示其职责。 */
export function PresidiumPage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  return (
    <>
      <PeopleSectionHero ctx={ctx} page="presidium" />
      <section class="section" aria-labelledby={PEOPLE_TITLE_ID}>
        <div class="container">
          <PresidiumCards presidium={roster.presidium} locale={ctx.locale} headingLevel={2} />
        </div>
      </section>
    </>
  );
}
