import { PEOPLE_SECTION_LABELS, type Locale, type LocalizedText, type PeopleSection } from '@msc-web/content';
import { COMMON, t, type CommonKey } from '../i18n/strings';
import { NAV_SECTIONS, PEOPLE_PAGES, PEOPLE_PAGE_PATHS, SECTION_PATHS, localePath, sectionOfPath, type NavSection, type PeoplePageKey } from '../routing/paths';

/**
 * The header navigation as data: each section with its link and, for Our People, the dropdown of its three pages.
 * Both the desktop bar and the phone menu render from this one list, so they never disagree.
 * 以数据描述的页眉导航：每个板块及其链接；"我们的团队" 还带有三个页面的下拉菜单。桌面导航栏与手机菜单都由这一份列表生成，因此两者永远一致。
 */

export const PEOPLE_PAGE_SECTIONS: Record<PeoplePageKey, PeopleSection> = {
  presidium: 'presidium',
  advisors: 'advisor',
  departments: 'department',
};

/** The Our People page that lists a section's people, for the way back from a person's own page. */
/** 列出某一分组成员的 "我们的团队" 页面，用于从个人页面返回。 */
export function peoplePageOfSection(section: PeopleSection): PeoplePageKey {
  return (Object.keys(PEOPLE_PAGE_SECTIONS) as PeoplePageKey[]).find((page) => PEOPLE_PAGE_SECTIONS[page] === section) ?? 'presidium';
}

export function peoplePageLabel(page: PeoplePageKey): LocalizedText {
  return PEOPLE_SECTION_LABELS[PEOPLE_PAGE_SECTIONS[page]];
}

const NAV_LABELS: Record<NavSection, CommonKey> = {
  home: 'navHome',
  events: 'navEvents',
  reviews: 'navReviews',
  people: 'navPeople',
  about: 'navAbout',
};

/**
 * "page" marks the page being shown; "true" marks the section that contains it, so a dropdown parent is highlighted
 * while one of its pages is open.
 * "page" 标记当前显示的页面；"true" 标记包含该页面的板块，因此打开下拉菜单中的某个页面时，其上级条目也会被突出显示。
 */
export type CurrentMark = 'page' | 'true' | undefined;

export interface NavLink {
  href: string;
  label: string;
  current: CurrentMark;
}

export interface NavItem extends NavLink {
  section: NavSection;
  children: NavLink[];
}

function childrenOf(section: NavSection, locale: Locale, path: string): NavLink[] {
  if (section !== 'people') return [];
  return PEOPLE_PAGES.map((page) => ({
    href: localePath(locale, PEOPLE_PAGE_PATHS[page]),
    label: peoplePageLabel(page)[locale],
    current: path === PEOPLE_PAGE_PATHS[page] ? 'page' : undefined,
  }));
}

export function navItems(locale: Locale, path: string): NavItem[] {
  const currentSection = sectionOfPath(path);
  return NAV_SECTIONS.map((section) => {
    const base = SECTION_PATHS[section];
    const current: CurrentMark = path === base ? 'page' : currentSection === section ? 'true' : undefined;
    return {
      section,
      href: localePath(locale, base),
      label: t(COMMON, NAV_LABELS[section], locale),
      current,
      children: childrenOf(section, locale, path),
    };
  });
}
