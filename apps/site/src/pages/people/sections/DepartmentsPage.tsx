import { DEPARTMENT_DESCRIPTIONS, DEPARTMENT_LABELS, defaultPositionTitle, type Locale } from '@msc-web/content';
import type { PageContext } from '../../context';
import { txt } from '../../components/common';
import { PEOPLE_TITLE_ID, PeopleSectionHero } from '../layout/PeopleSectionHero';
import { PersonCard, VacantPersonCard } from '../PersonCard';
import type { PeopleRoster } from '../roster';

/** One Department: its name and remit, the Head or a vacant Head card, then visible Vice Heads. */
/** 一个部门：名称与职能、部长或空缺的部长卡片，然后是正在显示的副部长。 */
function DepartmentBlock(props: { entry: PeopleRoster['departments'][number]; locale: Locale }) {
  const { entry, locale } = props;
  const headingId = `dept-${entry.department}`;
  return (
    <article class="dept" aria-labelledby={headingId}>
      <div class="dept__head">
        <h2 class="dept__name" id={headingId}>
          {txt(DEPARTMENT_LABELS[entry.department], locale)}
        </h2>
        <p class="dept__text">{txt(DEPARTMENT_DESCRIPTIONS[entry.department], locale)}</p>
      </div>
      <div class="dept__people">
        {entry.heads.length > 0 ? (
          entry.heads.map((person) => <PersonCard person={person} locale={locale} />)
        ) : (
          <VacantPersonCard title={txt(defaultPositionTitle('head', entry.department), locale)} locale={locale} />
        )}
        {entry.viceHeads.map((person) => (
          <PersonCard person={person} locale={locale} />
        ))}
      </div>
    </article>
  );
}

/** /people/departments: the five Departments in constitution order with their Heads and Vice Heads. */
/** /people/departments：按章程顺序排列的五个部门及其部长与副部长。 */
export function DepartmentsPage({ ctx, roster }: { ctx: PageContext; roster: PeopleRoster }) {
  return (
    <>
      <PeopleSectionHero ctx={ctx} page="departments" />
      <section class="section" aria-labelledby={PEOPLE_TITLE_ID}>
        <div class="container">
          {roster.departments.map((entry) => (
            <DepartmentBlock entry={entry} locale={ctx.locale} />
          ))}
        </div>
      </section>
    </>
  );
}
