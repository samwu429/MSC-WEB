/**
 * The site has one set of pages at the root, written in English with the Chinese beside it. Pages used to have an
 * English copy under /en; those addresses now redirect to the same path at the root, so old links keep working.
 * Page code builds links with sitePath.
 * 网站只有一套位于根路径的页面，以英文书写并附上中文。页面过去在 /en 之下有英文版本；这些地址现在会重定向到根路径下的相同路径，
 * 旧链接因此依然有效。页面代码使用 sitePath 生成链接。
 */

export const LEGACY_ENGLISH_PREFIX = '/en';

/**
 * A path with exactly one leading slash. A request for /en//evil.example must never turn into the link
 * "//evil.example", which a browser reads as another host.
 * 只带一个前导斜杠的路径。对 /en//evil.example 的请求绝不能变成链接 "//evil.example"，浏览器会把它当作另一个主机。
 */
export function rooted(path: string): string {
  return `/${path.replace(/^\/+/, '')}`;
}

/** The link for a page path: "/events", or "/" for the home page. */
/** 页面路径对应的链接："/events"；首页为 "/"。 */
export function sitePath(path: string): string {
  return rooted(path);
}

/** Where an old /en address now lives, such as "/events" for "/en/events"; null for any other path. */
/** 旧的 /en 地址现在的位置，例如 "/en/events" 对应 "/events"；其他路径返回 null。 */
export function legacyEnglishTarget(pathname: string): string | null {
  if (pathname === LEGACY_ENGLISH_PREFIX || pathname === `${LEGACY_ENGLISH_PREFIX}/`) return '/';
  if (pathname.startsWith(`${LEGACY_ENGLISH_PREFIX}/`)) return rooted(pathname.slice(LEGACY_ENGLISH_PREFIX.length));
  return null;
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
 * Our People shows everyone at /people: the Honorary Advisors, then the Presidium, then the Department Leads. Each
 * group also has a page of its own, reached from the tabs at the top, in the same order.
 * "我们的团队" 在 /people 显示所有人：先荣誉顾问，再主席团，最后部长团。每个团体也有自己的页面，从顶部的标签进入，顺序相同。
 */
export const PEOPLE_PAGES = ['advisors', 'presidium', 'departments'] as const;

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
 * The href of a link an editor entered, such as the announcement or join link. A link written for the old English
 * pages (/en/events) points at the page itself; anything else is left as entered.
 * 编辑者填写的链接（例如公告链接或加入链接）的 href。为旧英文页面写的链接（/en/events）改为指向页面本身；其他链接保持原样。
 */
export function siteHref(url: string): string {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  const cut = url.search(/[?#]/);
  const path = cut === -1 ? url : url.slice(0, cut);
  const target = legacyEnglishTarget(path);
  if (target === null || sectionOfPath(target) === null) return url;
  return `${target}${cut === -1 ? '' : url.slice(cut)}`;
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
