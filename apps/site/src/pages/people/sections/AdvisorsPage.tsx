import type { PageContext } from '../../context';
import { EmptyState } from '../../components/common';
import { t } from '../../i18n/strings';
import { PEOPLE_TITLE_ID, PeopleSectionHero } from '../layout/PeopleSectionHero';
import { PersonCard } from '../PersonCard';
import type { PeopleRoster } from '../roster';
import { PEOPLE } from '../strings';

/** /people/advisors: the visible Honorary Advisors, or a note that they will be announced. */
/** /people/advisors：正在显示的荣誉顾问；尚无人时显示即将公布的说明。 */
export function AdvisorsPage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  const { locale } = ctx;
  return (
    <>
      <PeopleSectionHero ctx={ctx} page="advisors" />
      <section class="section" aria-labelledby={PEOPLE_TITLE_ID}>
        <div class="container">
          {roster.advisors.length > 0 ? (
            <div class="people-grid">
              {roster.advisors.map((person) => (
                <PersonCard person={person} locale={locale} headingLevel={2} />
              ))}
            </div>
          ) : (
            <EmptyState title={t(PEOPLE, 'advisorsEmptyTitle', locale)} text={t(PEOPLE, 'advisorsEmptyText', locale)} />
          )}
        </div>
      </section>
    </>
  );
}
