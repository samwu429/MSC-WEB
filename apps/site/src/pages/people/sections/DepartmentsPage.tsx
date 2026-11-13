import type { PageContext } from '../../context';
import { PEOPLE_TITLE_ID, PeopleSectionHero } from '../layout/PeopleSectionHero';
import type { PeopleRoster } from '../roster';
import { DepartmentLeads, DepartmentsMoreLink } from './groups';

/**
 * /people/departments: the Heads and Vice Heads of the five Departments in constitution order, as tiles a size larger
 * than on /people, with a line for each Department without a Head. The hero links to what each Department does.
 * /people/departments：按章程顺序排列的五个部门的部长与副部长，方块比 /people 上大一号；没有部长的部门各占一行文字。页首链接到各部门职能。
 */
export function DepartmentsPage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  return (
    <>
      <PeopleSectionHero ctx={ctx} view="departments">
        <DepartmentsMoreLink locale={ctx.locale} />
      </PeopleSectionHero>
      <section class="section people-page" aria-labelledby={PEOPLE_TITLE_ID}>
        <div class="container">
          <DepartmentLeads departments={roster.departments} locale={ctx.locale} headingLevel={2} />
        </div>
      </section>
    </>
  );
}
