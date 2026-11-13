import type { PageContext } from '../../context';
import { SectionHeading, txt } from '../../components/common';
import { peoplePageLabel } from '../../layout/navigation';
import type { PeoplePageKey } from '../../routing/paths';
import { PeopleSectionHero, peoplePageLead } from '../layout/PeopleSectionHero';
import { PresidiumCards } from '../PresidiumCards';
import type { PeopleRoster } from '../roster';
import { AdvisorCards, DepartmentLeads, DepartmentsMoreLink } from '../sections/groups';

/** One tier of the roster on /people: its h2 over a short gold rule, its lead and anything under the lead, then its people. */
/** /people 名单中的一层：h2 及其下方的金色短线、导语以及导语之下的内容，然后是该团体的成员。 */
function GroupSection(props: { ctx: PageContext; page: PeoplePageKey; alt?: boolean; more?: unknown; children: unknown }) {
  const id = `people-${props.page}`;
  return (
    <section class={props.alt ? 'section section--tight section--alt people-tier' : 'section section--tight people-tier'} aria-labelledby={id}>
      <div class="container">
        <SectionHeading id={id} title={txt(peoplePageLabel(props.page), props.ctx.locale)} lead={peoplePageLead(props.page, props.ctx)}>
          {props.more}
        </SectionHeading>
        {props.children}
      </div>
    </section>
  );
}

/**
 * /people: everyone at once, read from the top down in the order of Article 4 of the constitution: the Presidium, the
 * Department Leads, then the Honorary Advisors, every person as a tile of the same size, so no group outweighs another
 * by its photos. Vacant offices are quiet lines under their group. A single group is reached from the Our People
 * dropdown in the site header.
 * /people：一次显示所有人，按章程第四条的顺序自上而下依次为主席团、部长团与荣誉顾问。每位成员都是同样大小的方块，
 * 任何团体都不会因照片更大而显得更重。空缺的职位是其团体下方安静的一行文字。单个团体从网站页眉的 "我们的团队" 下拉菜单进入。
 */
export function AllPeoplePage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  const { locale } = ctx;
  return (
    <>
      <PeopleSectionHero ctx={ctx} view="all" />
      <GroupSection ctx={ctx} page="presidium">
        <PresidiumCards presidium={roster.presidium} locale={locale} headingLevel={3} />
      </GroupSection>
      <GroupSection ctx={ctx} page="departments" alt more={<DepartmentsMoreLink locale={locale} />}>
        <DepartmentLeads departments={roster.departments} locale={locale} headingLevel={3} />
      </GroupSection>
      <GroupSection ctx={ctx} page="advisors">
        <AdvisorCards advisors={roster.advisors} locale={locale} headingLevel={3} />
      </GroupSection>
    </>
  );
}
