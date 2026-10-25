import { listVisiblePeople } from '../../../../infrastructure/d1/public/people';
import { loadPageContext } from '../../../../pages/context';
import { COMMON, t } from '../../../../pages/i18n/strings';
import { PEOPLE_PAGE_SECTIONS, peoplePageLabel } from '../../../../pages/layout/navigation';
import { PeopleHubPage } from '../../../../pages/people/hub/PeopleHubPage';
import { peoplePageLead } from '../../../../pages/people/layout/PeopleSectionHero';
import { buildRoster } from '../../../../pages/people/roster';
import { AdvisorsPage } from '../../../../pages/people/sections/AdvisorsPage';
import { DepartmentsPage } from '../../../../pages/people/sections/DepartmentsPage';
import { PresidiumPage } from '../../../../pages/people/sections/PresidiumPage';
import { PEOPLE } from '../../../../pages/people/strings';
import { renderPage } from '../../../../pages/render';
import type { PeoplePageKey } from '../../../../pages/routing/paths';
import type { PageHandler } from '../page-handler';

/** /people: the hub linking to the three Our People pages. */
/** /people：链接到三个 "我们的团队" 页面的入口页。 */
export const peoplePage: PageHandler = async (c, locale) => {
  const ctx = await loadPageContext(c, locale);
  return renderPage(c, ctx, { title: t(COMMON, 'navPeople', locale), description: t(PEOPLE, 'heroLead', locale) }, <PeopleHubPage ctx={ctx} />);
};

const VIEWS: Record<PeoplePageKey, typeof PresidiumPage> = {
  presidium: PresidiumPage,
  advisors: AdvisorsPage,
  departments: DepartmentsPage,
};

/** One Our People page, reading only the visible people of its own group. */
/** 一个 "我们的团队" 页面，只读取本团体中正在显示的成员。 */
function peopleGroupPage(page: PeoplePageKey): PageHandler {
  const View = VIEWS[page];
  return async (c, locale) => {
    const [ctx, people] = await Promise.all([loadPageContext(c, locale), listVisiblePeople(c.env.DB, PEOPLE_PAGE_SECTIONS[page])]);
    return renderPage(
      c,
      ctx,
      { title: peoplePageLabel(page)[locale], description: peoplePageLead(page, ctx) },
      <View ctx={ctx} roster={buildRoster(people)} />,
    );
  };
}

export const presidiumPage = peopleGroupPage('presidium');
export const advisorsPage = peopleGroupPage('advisors');
export const departmentsPage = peopleGroupPage('departments');
