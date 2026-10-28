import { mediaUrl, personDisplayTitle } from '@msc-web/content';
import { findVisiblePerson, listVisiblePeople } from '../../../../infrastructure/d1/public/people';
import { txt } from '../../../../pages/components/common';
import { loadPageContext } from '../../../../pages/context';
import { COMMON, t } from '../../../../pages/i18n/strings';
import { PEOPLE_PAGE_SECTIONS, peoplePageLabel } from '../../../../pages/layout/navigation';
import { renderNotFound } from '../../../../pages/errors/ErrorPages';
import { PersonPage } from '../../../../pages/people/detail/PersonPage';
import { AllPeoplePage } from '../../../../pages/people/all/AllPeoplePage';
import { peoplePageLead } from '../../../../pages/people/layout/PeopleSectionHero';
import { buildRoster } from '../../../../pages/people/roster';
import { AdvisorsPage } from '../../../../pages/people/sections/AdvisorsPage';
import { DepartmentsPage } from '../../../../pages/people/sections/DepartmentsPage';
import { PresidiumPage } from '../../../../pages/people/sections/PresidiumPage';
import { PEOPLE } from '../../../../pages/people/strings';
import { renderPage } from '../../../../pages/render';
import { isPersonId, type PeoplePageKey } from '../../../../pages/routing/paths';
import type { PageHandler } from '../page-handler';

/** /people: every visible person, the Honorary Advisors first, then the Presidium, then the Department Leads. */
/** /people：所有正在显示的成员，先荣誉顾问，再主席团，最后部长团。 */
export const peoplePage: PageHandler = async (c, locale) => {
  const [ctx, people] = await Promise.all([loadPageContext(c, locale), listVisiblePeople(c.env.DB)]);
  return renderPage(
    c,
    ctx,
    { title: t(COMMON, 'navPeople', locale), description: t(PEOPLE, 'heroLead', locale) },
    <AllPeoplePage ctx={ctx} roster={buildRoster(people)} />,
  );
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

/** /people/:id: one visible person's own page; a hidden person, an unknown id or a malformed one is not found. */
/** /people/:id：一位正在显示的成员的个人页面；隐藏的成员、不存在或格式不正确的编号均返回未找到。 */
export const personPage: PageHandler = async (c, locale) => {
  const id = c.req.param('id');
  if (!isPersonId(id)) return renderNotFound(c);
  const [ctx, person] = await Promise.all([loadPageContext(c, locale), findVisiblePerson(c.env.DB, id)]);
  if (!person) return renderNotFound(c);
  const description = [txt(personDisplayTitle(person), locale), txt(person.affiliation, locale)].filter(Boolean).join(' · ');
  return renderPage(
    c,
    ctx,
    { title: txt(person.name, locale), description, image: person.photoKey ? mediaUrl(person.photoKey) : undefined },
    <PersonPage ctx={ctx} person={person} />,
  );
};
