import type { PageContext } from '../../context';
import { txt } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { peoplePageLabel } from '../../layout/navigation';
import { PEOPLE_PAGES, PEOPLE_PAGE_PATHS, SECTION_PATHS, sitePath, type PeoplePageKey } from '../../routing/paths';
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

export function peoplePageEyebrow(page: PeoplePageKey, ctx: Pick<PageContext, 'locale'>): string {
  return t(PEOPLE, EYEBROWS[page], ctx.locale);
}

export function peoplePageLead(page: PeoplePageKey, ctx: Pick<PageContext, 'locale'>): string {
  return t(PEOPLE, LEADS[page], ctx.locale);
}

/**
 * The header of every Our People page. Its tabs are the one way between them: All, then each group in the order
 * /people lists them.
 * 每个 "我们的团队" 页面的页首。页面之间只通过这里的标签切换：先是 "全部"，再按 /people 的排列顺序列出各团体。
 */
export function PeopleSectionHero({ ctx, view }: { ctx: PageContext; view: PeopleView }) {
  const { locale } = ctx;
  const tabs = [
    { key: 'all', href: SECTION_PATHS.people, label: t(PEOPLE, 'allTab', locale) },
    ...PEOPLE_PAGES.map((page) => ({ key: page, href: PEOPLE_PAGE_PATHS[page], label: txt(peoplePageLabel(page), locale) })),
  ];
  return (
    <header class="page-hero">
      <div class="container">
        <div class="eyebrow">{view === 'all' ? t(PEOPLE, 'heroEyebrow', locale) : peoplePageEyebrow(view, ctx)}</div>
        <h1 class="page-hero__title" id={PEOPLE_TITLE_ID}>
          {view === 'all' ? t(COMMON, 'navPeople', locale) : txt(peoplePageLabel(view), locale)}
        </h1>
        <p class="page-hero__lead">{view === 'all' ? t(PEOPLE, 'heroLead', locale) : peoplePageLead(view, ctx)}</p>
        <nav class="tabs" aria-label={t(PEOPLE, 'subnavLabel', locale)}>
          {tabs.map((tab) => (
            <a class="tab" href={sitePath(tab.href)} aria-current={tab.key === view ? 'page' : undefined}>
              {tab.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
