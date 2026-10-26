import type { PageContext } from '../../context';
import { Icon } from '../../components/Icon';
import { txt } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { peoplePageLabel } from '../../layout/navigation';
import { PEOPLE_PAGES, PEOPLE_PAGE_PATHS, SECTION_PATHS, sitePath, type PeoplePageKey } from '../../routing/paths';
import { PEOPLE } from '../strings';

/** The h1 of each Our People page, which also labels the page's main section. */
/** 每个 "我们的团队" 页面的 h1，同时作为页面主体部分的标签。 */
export const PEOPLE_TITLE_ID = 'people-title';

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
 * The header of the Presidium, Honorary Advisors and Department Leads pages: a way back to the hub, the article
 * of the constitution the group comes from, and tabs to move between the three pages.
 * 主席团、荣誉顾问与部长团页面的页首：返回入口页的链接、该团体依据的章程条款，以及在三个页面之间切换的标签。
 */
export function PeopleSectionHero({ ctx, page }: { ctx: PageContext; page: PeoplePageKey }) {
  const { locale } = ctx;
  return (
    <header class="page-hero">
      <div class="container">
        <a class="backlink" href={sitePath(SECTION_PATHS.people)}>
          <Icon name="arrow" />
          {t(COMMON, 'navPeople', locale)}
        </a>
        <div class="eyebrow">{peoplePageEyebrow(page, ctx)}</div>
        <h1 class="page-hero__title" id={PEOPLE_TITLE_ID}>
          {txt(peoplePageLabel(page), locale)}
        </h1>
        <p class="page-hero__lead">{peoplePageLead(page, ctx)}</p>
        <nav class="tabs" aria-label={t(PEOPLE, 'subnavLabel', locale)}>
          {PEOPLE_PAGES.map((other) => (
            <a class="tab" href={sitePath(PEOPLE_PAGE_PATHS[other])} aria-current={other === page ? 'page' : undefined}>
              {txt(peoplePageLabel(other), locale)}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
