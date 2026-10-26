import type { Locale } from '@msc-web/content';

/**
 * Chinese pages live at the root and English pages under /en, with the same path after the prefix: /events and
 * /en/events are one page in two languages. Page code works with the locale-neutral path ("/events") and turns it
 * into a link with localePath.
 * 中文页面位于根路径，英文页面位于 /en 之下，前缀之后的路径相同：/events 与 /en/events 是同一页面的两种语言。
 * 页面代码使用与语言无关的路径（"/events"），再用 localePath 转换成链接。
 */

export const ENGLISH_PREFIX = '/en';

/**
 * A path with exactly one leading slash. A request for /en//evil.example must never turn into the link
 * "//evil.example", which a browser reads as another host.
 * 只带一个前导斜杠的路径。对 /en//evil.example 的请求绝不能变成链接 "//evil.example"，浏览器会把它当作另一个主机。
 */
function rooted(path: string): string {
  return `/${path.replace(/^\/+/, '')}`;
}

/** "/events" in a locale: "/events" or "/en/events". The home page is "/" or "/en". */
/** 某语言下的 "/events"：即 "/events" 或 "/en/events"。首页为 "/" 或 "/en"。 */
export function localePath(locale: Locale, path: string): string {
  const clean = rooted(path);
  if (locale === 'zh') return clean;
  return clean === '/' ? ENGLISH_PREFIX : `${ENGLISH_PREFIX}${clean}`;
}

/** The locale and the locale-neutral path of a request path. */
/** 请求路径对应的语言与语言无关的路径。 */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  if (pathname === ENGLISH_PREFIX || pathname === `${ENGLISH_PREFIX}/`) return { locale: 'en', path: '/' };
  if (pathname.startsWith(`${ENGLISH_PREFIX}/`)) return { locale: 'en', path: rooted(pathname.slice(ENGLISH_PREFIX.length)) };
  return { locale: 'zh', path: rooted(pathname) };
}

/** Site sections, for the header navigation and the current-page marker. */
/** 网站板块，用于页眉导航与当前页标记。 */
export const NAV_SECTIONS = ['home', 'events', 'reviews', 'people', 'about'] as const;

export type NavSection = (typeof NAV_SECTIONS)[number];

export const SECTION_PATHS: Record<NavSection, string> = {
  home: '/',
  events: '/events',
  reviews: '/reviews',
  people: '/people',
  about: '/about',
};

/**
 * Our People is split into three pages, listed in the order the header menu shows them: the Presidium, Honorary
 * Advisors, then the Department Leads. /people itself is a hub that links to all three.
 * "我们的团队" 分为三个页面，按页眉菜单中的顺序排列：主席团、荣誉顾问、部长团。/people 本身是链接到这三个页面的入口页。
 */
export const PEOPLE_PAGES = ['presidium', 'advisors', 'departments'] as const;

export type PeoplePageKey = (typeof PEOPLE_PAGES)[number];

export const PEOPLE_PAGE_PATHS: Record<PeoplePageKey, string> = {
  presidium: '/people/presidium',
  advisors: '/people/advisors',
  departments: '/people/departments',
};

/** A person's own page, such as /people/per_0123…; the id never changes, so the address stays valid after edits. */
/** 成员的个人页面，例如 /people/per_0123…；编号不会改变，因此修改资料后地址依然有效。 */
export function personPath(id: string): string {
  return `/people/${id}`;
}

/** Ids as the database makes them (per_ and 32 hex digits) and as sample data writes them. */
/** 数据库生成的编号（per_ 加 32 位十六进制数字），以及示例数据中的写法。 */
export function isPersonId(value: string | undefined): value is string {
  return value !== undefined && /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

export function sectionOfPath(path: string): NavSection | null {
  if (path === '/') return 'home';
  for (const section of NAV_SECTIONS) {
    const base = SECTION_PATHS[section];
    if (base !== '/' && (path === base || path.startsWith(`${base}/`))) return section;
  }
  return null;
}

/**
 * The href of a link an editor entered, such as the announcement or join link. A site path of a public page is
 * moved into the visitor's language; anything else (another site, /UTMMSC/, /download/, /media/, /admin, or a
 * path already under /en) is left as entered.
 * 编辑者填写的链接（例如公告链接或加入链接）的 href。指向公开页面的本站路径会换成访问者的语言；其他链接
 * （外部网站、/UTMMSC/、/download/、/media/、/admin，或已经位于 /en 之下的路径）保持原样。
 */
export function siteHref(locale: Locale, url: string): string {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  const cut = url.search(/[?#]/);
  const path = cut === -1 ? url : url.slice(0, cut);
  if (sectionOfPath(path) === null) return url;
  return `${localePath(locale, path)}${cut === -1 ? '' : url.slice(cut)}`;
}

/** Adds query parameters to a path, skipping empty values. */
/** 为路径添加查询参数，跳过空值。 */
export function withQuery(path: string, query: Record<string, string | number | null | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}
