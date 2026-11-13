import type { PageContext } from '../../context';
import { PEOPLE_TITLE_ID, PeopleSectionHero } from '../layout/PeopleSectionHero';
import { PresidiumCards } from '../PresidiumCards';
import type { PeopleRoster } from '../roster';

/** /people/presidium: the holders of the four Presidium offices as tiles a size larger than on /people, and a line for each vacant office. */
/** /people/presidium：四个主席团职位的担任者，方块比 /people 上大一号；每个空缺的职位占一行文字。 */
export function PresidiumPage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  return (
    <>
      <PeopleSectionHero ctx={ctx} view="presidium" />
      <section class="section people-page" aria-labelledby={PEOPLE_TITLE_ID}>
        <div class="container">
          <PresidiumCards presidium={roster.presidium} locale={ctx.locale} headingLevel={2} />
        </div>
      </section>
    </>
  );
}
