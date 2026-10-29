import type { PageContext } from '../../context';
import { txt } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { peoplePageLabel } from '../../layout/navigation';
import type { PeoplePageKey } from '../../routing/paths';
import { PEOPLE } from '../strings';

/** The h1 of each Our People page, which also labels the page's main section. */
/** 每个 "我们的团队" 页面的 h1，同时作为页面主体部分的标签。 */
export const PEOPLE_TITLE_ID = 'people-title';

/** Which Our People page is open: everyone at /people, or one group's own page. */
/** 当前打开的 "我们的团队" 页面：/people 上的所有人，或某一团体自己的页面。 */
export type PeopleView = 'all' | PeoplePageKey;

const EYEBROWS = {
  presidium: 'presidiumEyebrow',
  advisors: 'advisorsEyebrow',
  departments: 'departmentsEyebrow',
} as const satisfies Record<PeoplePageKey, keyof typeof PEOPLE>;

const LEADS = {
  presidium: 'presidiumLead',
  advisors: 'advisorsLead',
  departments: 'departmentsLead',
} as const satisfies Record<PeoplePageKey, keyof typeof PEOPLE>;

function peoplePageEyebrow(page: PeoplePageKey, ctx: Pick<PageContext, 'locale'>): string {
  return t(PEOPLE, EYEBROWS[page], ctx.locale);
}

export function peoplePageLead(page: PeoplePageKey, ctx: Pick<PageContext, 'locale'>): string {
  return t(PEOPLE, LEADS[page], ctx.locale);
}

/**
 * The header of every Our People page: eyebrow, title and lead. It carries no links between the pages: a single group
 * is reached only from the Our People dropdown in the site header, and the header link itself shows everyone.
 * 每个 "我们的团队" 页面的页首：眉标、标题与导语。页首不含页面之间的链接：单个团体只能从网站页眉的 "我们的团队" 下拉菜单进入，
 * 页眉链接本身显示所有人。
 */
export function PeopleSectionHero({ ctx, view }: { ctx: PageContext; view: PeopleView }) {
  const { locale } = ctx;
  return (
    <header class="page-hero">
      <div class="container">
        <div class="eyebrow">{view === 'all' ? t(PEOPLE, 'heroEyebrow', locale) : peoplePageEyebrow(view, ctx)}</div>
        <h1 class="page-hero__title" id={PEOPLE_TITLE_ID}>
          {view === 'all' ? t(COMMON, 'navPeople', locale) : txt(peoplePageLabel(view), locale)}
        </h1>
        <p class="page-hero__lead">{view === 'all' ? t(PEOPLE, 'heroLead', locale) : peoplePageLead(view, ctx)}</p>
      </div>
    </header>
  );
}
