import { PEOPLE_SECTION_LABELS, type LocalizedText, type PeopleSection } from '@msc-web/content';
import type { Copy } from '../components/common';
import { COMMON, type CommonKey } from '../i18n/strings';
import {
  ACADEMIC_PAGES,
  ACADEMIC_PAGE_PATHS,
  NAV_SECTIONS,
  PEOPLE_PAGES,
  PEOPLE_PAGE_PATHS,
  SECTION_PATHS,
  isWithin,
  sectionOfPath,
  sitePath,
  type AcademicPageKey,
  type NavSection,
  type PeoplePageKey,
} from '../routing/paths';

/**
 * The header navigation as data: each section with its link and, for Academic Activities and Our People, a dropdown
 * of their pages. The section link itself shows everything; the dropdown is the way to open one part on its own page.
 * Both the desktop bar and the phone menu render from this one list, so they never disagree. Labels carry both
 * languages, except Our People and its groups, which are English only.
 * 以数据描述的页眉导航：每个板块及其链接；"学术活动" 与 "我们的团队" 还带有其子页面的下拉菜单。板块链接本身显示全部内容，
 * 下拉菜单用于单独打开其中一部分的页面。桌面导航栏与手机菜单都由这一份列表生成，因此两者永远一致。标签带有两种语言，
 * "我们的团队" 及其团体除外，只显示英文。
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
  academics: 'navAcademics',
  people: 'navPeople',
  about: 'navAbout',
};

const ACADEMIC_PAGE_LABELS: Record<AcademicPageKey, CommonKey> = {
  reviews: 'navReviews',
  interestClasses: 'navInterestClasses',
};

/**
 * "page" marks the page being shown; "true" marks the section that contains it, so a dropdown parent is highlighted
 * while one of its pages is open, and a dropdown page while one of its own sub-pages is open.
 * "page" 标记当前显示的页面；"true" 标记包含该页面的板块，因此打开下拉菜单中的某个页面时，其上级条目也会被突出显示；
 * 打开下拉菜单中某个页面的下级页面时，该页面同样会被突出显示。
 */
export type CurrentMark = 'page' | 'true' | undefined;

export interface NavLink {
  href: string;
  label: Copy;
  current: CurrentMark;
}

export interface NavItem extends NavLink {
  section: NavSection;
  children: NavLink[];
}

/** "page" on the dropdown page itself, "true" on a page under it, such as a course under Test Reviews. */
/** 下拉菜单中的页面本身为 "page"，其下级页面（例如考前复习下的课程）为 "true"。 */
function childMark(path: string, childPath: string): CurrentMark {
  if (path === childPath) return 'page';
  return isWithin(path, childPath) ? 'true' : undefined;
}

function childrenOf(section: NavSection, path: string): NavLink[] {
  if (section === 'academics') {
    return ACADEMIC_PAGES.map((page) => ({
      href: sitePath(ACADEMIC_PAGE_PATHS[page]),
      label: COMMON[ACADEMIC_PAGE_LABELS[page]],
      current: childMark(path, ACADEMIC_PAGE_PATHS[page]),
    }));
  }
  if (section === 'people') {
    return PEOPLE_PAGES.map((page) => ({
      href: sitePath(PEOPLE_PAGE_PATHS[page]),
      label: peoplePageLabel(page).en,
      current: childMark(path, PEOPLE_PAGE_PATHS[page]),
    }));
  }
  return [];
}

/**
 * The navigation for a page at `path`. A page that belongs somewhere other than its own address passes the place it
 * belongs instead: an interest class's page, /events/<slug>, is marked as a page under /interest-classes.
 * 位于 `path` 的页面的导航。页面所属的位置与其自身地址不同时，传入其所属的位置：兴趣课的页面 /events/<slug> 被标记为
 * /interest-classes 之下的页面。
 */
export function navItems(path: string): NavItem[] {
  const currentSection = sectionOfPath(path);
  return NAV_SECTIONS.map((section) => {
    const base = SECTION_PATHS[section];
    const current: CurrentMark = path === base ? 'page' : currentSection === section ? 'true' : undefined;
    const label = COMMON[NAV_LABELS[section]];
    return {
      section,
      href: sitePath(base),
      label: section === 'people' ? label.en : label,
      current,
      children: childrenOf(section, path),
    };
  });
}
