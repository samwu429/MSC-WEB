import { LOCALES, courseSlug, type Locale } from '@msc-web/content';
import type { Env } from '../../../env';
import { listPublishedEventLinks } from '../../../infrastructure/d1/public/events';
import { listVisiblePeople } from '../../../infrastructure/d1/public/people';
import { listReviewedCourseLinks } from '../../../infrastructure/d1/public/reviews';
import { NAV_SECTIONS, PEOPLE_PAGES, PEOPLE_PAGE_PATHS, SECTION_PATHS, localePath, personPath } from '../../../pages/routing/paths';

interface SitemapPage {
  /** Locale-neutral path, such as "/events/2026-10-mid-autumn". */
  /** 与语言无关的路径，例如 "/events/2026-10-mid-autumn"。 */
  path: string;
  lastmod?: string;
}

const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => XML_ESCAPES[character] ?? character);
}

/** Language versions of every page with Chinese as the default, the same set as the alternate links in the page head. */
/** 每个页面的各语言版本，以中文为默认版本，与页面 head 中的替代链接相同。 */
const ALTERNATES: readonly (readonly [hreflang: string, locale: Locale])[] = [
  ['zh-CN', 'zh'],
  ['en', 'en'],
  ['x-default', 'zh'],
];

/** One <url> per page and language, listing every language version of the page as an alternate. */
/** 每个页面的每种语言各一个 <url>，并将该页面的各语言版本列为替代链接。 */
function urlEntry(origin: string, page: SitemapPage, locale: Locale): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(`${origin}${localePath(locale, page.path)}`)}</loc>`,
    ...(page.lastmod ? [`    <lastmod>${escapeXml(page.lastmod)}</lastmod>`] : []),
    ...ALTERNATES.map(([hreflang, alternate]) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(`${origin}${localePath(alternate, page.path)}`)}"/>`),
    '  </url>',
  ].join('\n');
}

/** The sitemap of every public page in both languages: the sections, the Our People pages, every visible person, every published event and every reviewed course. */
/** 包含两种语言全部公开页面的站点地图：各板块、"我们的团队" 各页面、每位正在显示的成员、每个已发布的活动以及每门有复习的课程。 */
export async function sitemapXml(env: Env): Promise<string> {
  const origin = env.PUBLIC_ORIGIN.replace(/\/+$/, '');
  const [people, events, courses] = await Promise.all([listVisiblePeople(env.DB), listPublishedEventLinks(env.DB), listReviewedCourseLinks(env.DB)]);
  const pages: SitemapPage[] = [
    ...NAV_SECTIONS.map((section) => ({ path: SECTION_PATHS[section] })),
    ...PEOPLE_PAGES.map((page) => ({ path: PEOPLE_PAGE_PATHS[page] })),
    ...people.map((person) => ({ path: personPath(person.id), lastmod: person.updatedAt })),
    ...events.map((event) => ({ path: `/events/${event.slug}`, lastmod: event.updatedAt })),
    ...courses.map((course) => ({ path: `/reviews/${courseSlug(course.code)}`, lastmod: course.updatedAt })),
  ];
  const entries = pages.flatMap((page) => LOCALES.map((locale) => urlEntry(origin, page, locale)));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}
