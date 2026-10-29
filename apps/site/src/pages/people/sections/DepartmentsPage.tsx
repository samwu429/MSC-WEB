import type { PageContext } from '../../context';
import { PEOPLE_TITLE_ID, PeopleSectionHero } from '../layout/PeopleSectionHero';
import type { PeopleRoster } from '../roster';
import { DepartmentBlocks } from './groups';

/** /people/departments: the five Departments in constitution order with their Heads and Vice Heads. */
/** /people/departments：按章程顺序排列的五个部门及其部长与副部长。 */
export function DepartmentsPage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  return (
    <>
      <PeopleSectionHero ctx={ctx} view="departments" />
      <section class="section" aria-labelledby={PEOPLE_TITLE_ID}>
        <div class="container">
          <DepartmentBlocks departments={roster.departments} locale={ctx.locale} nameLevel={2} />
        </div>
      </section>
    </>
  );
}
