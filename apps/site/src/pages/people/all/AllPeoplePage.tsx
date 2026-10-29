import type { PageContext } from '../../context';
import { SectionHeading, txt } from '../../components/common';
import { peoplePageLabel } from '../../layout/navigation';
import type { PeoplePageKey } from '../../routing/paths';
import { PeopleSectionHero, peoplePageLead } from '../layout/PeopleSectionHero';
import { PresidiumCards } from '../PresidiumCards';
import type { PeopleRoster } from '../roster';
import { AdvisorCards, DepartmentBlocks } from '../sections/groups';

/** One tier of the roster on /people: its h2 over a short gold rule and its lead, then its people. */
/** /people 名单中的一层：h2 及其下方的金色短线与导语，然后是该团体的成员。 */
function GroupSection(props: { ctx: PageContext; page: PeoplePageKey; alt?: boolean; children: unknown }) {
  const id = `people-${props.page}`;
  return (
    <section class={props.alt ? 'section section--tight section--alt people-tier' : 'section section--tight people-tier'} aria-labelledby={id}>
      <div class="container">
        <SectionHeading id={id} title={txt(peoplePageLabel(props.page), props.ctx.locale)} lead={peoplePageLead(props.page, props.ctx)} />
        {props.children}
      </div>
    </section>
  );
}

/**
 * /people: everyone at once, as a roster read from the top down: the Honorary Advisors as portraits, the four
 * Presidium offices as seats of equal size, then the five Departments with their leads. A single group is reached
 * from the Our People dropdown in the site header.
 * /people：一次显示所有人，自上而下排成名单：荣誉顾问为肖像，主席团四个职位为大小相同的席位，然后是五个部门及其负责人。
 * 单个团体从网站页眉的 "我们的团队" 下拉菜单进入。
 */
export function AllPeoplePage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  const { locale } = ctx;
  return (
    <>
      <PeopleSectionHero ctx={ctx} view="all" />
      <GroupSection ctx={ctx} page="advisors">
        <AdvisorCards advisors={roster.advisors} locale={locale} headingLevel={3} />
      </GroupSection>
      <GroupSection ctx={ctx} page="presidium" alt>
        <PresidiumCards presidium={roster.presidium} locale={locale} headingLevel={3} />
      </GroupSection>
      <GroupSection ctx={ctx} page="departments">
        <DepartmentBlocks departments={roster.departments} locale={locale} nameLevel={3} />
      </GroupSection>
    </>
  );
}
