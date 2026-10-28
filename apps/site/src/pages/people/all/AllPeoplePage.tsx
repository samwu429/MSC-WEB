import type { PageContext } from '../../context';
import { SectionHeading, txt } from '../../components/common';
import { peoplePageLabel } from '../../layout/navigation';
import type { PeoplePageKey } from '../../routing/paths';
import { PeopleSectionHero, peoplePageEyebrow, peoplePageLead } from '../layout/PeopleSectionHero';
import { PresidiumCards } from '../PresidiumCards';
import type { PeopleRoster } from '../roster';
import { AdvisorCards, DepartmentBlocks } from '../sections/groups';

/** One group on /people, under its own h2. */
/** /people 上的一个团体，位于自己的 h2 之下。 */
function GroupSection(props: { ctx: PageContext; page: PeoplePageKey; alt?: boolean; children: unknown }) {
  const id = `people-${props.page}`;
  return (
    <section class={props.alt ? 'section section--alt' : 'section'} aria-labelledby={id}>
      <div class="container">
        <SectionHeading
          id={id}
          eyebrow={peoplePageEyebrow(props.page, props.ctx)}
          title={txt(peoplePageLabel(props.page), props.ctx.locale)}
          lead={peoplePageLead(props.page, props.ctx)}
        />
        {props.children}
      </div>
    </section>
  );
}

/**
 * /people: everyone at once, the Honorary Advisors first, then the Presidium, then the Department Leads. The tabs at
 * the top narrow it to one group.
 * /people：一次显示所有人，先荣誉顾问，再主席团，最后部长团。顶部的标签可以只看某一团体。
 */
export function AllPeoplePage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  const { locale } = ctx;
  return (
    <>
      <PeopleSectionHero ctx={ctx} view="all" />
      <GroupSection ctx={ctx} page="advisors">
        <AdvisorCards roster={roster} locale={locale} headingLevel={3} />
      </GroupSection>
      <GroupSection ctx={ctx} page="presidium" alt>
        <PresidiumCards presidium={roster.presidium} locale={locale} headingLevel={3} />
      </GroupSection>
      <GroupSection ctx={ctx} page="departments">
        <DepartmentBlocks roster={roster} locale={locale} nameLevel={3} />
      </GroupSection>
    </>
  );
}
