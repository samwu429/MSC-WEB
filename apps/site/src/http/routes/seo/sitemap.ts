import { courseSlug } from '@msc-web/content';
import type { Env } from '../../../env';
import { listPublishedEventLinks } from '../../../infrastructure/d1/public/events';
import { listVisiblePeople } from '../../../infrastructure/d1/public/people';
import { listReviewedCourseLinks } from '../../../infrastructure/d1/public/reviews';
import { NAV_SECTIONS, PEOPLE_PAGES, PEOPLE_PAGE_PATHS, SECTION_PATHS, personPath, sitePath } from '../../../pages/routing/paths';

interface SitemapPage {
  /** Page path, such as "/events/2026-10-mid-autumn". */
  /** 页面路径，例如 "/events/2026-10-mid-autumn"。 */
  path: string;
  lastmod?: string;
}

const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => XML_ESCAPES[character] ?? character);
}

/** One <url> per page. */
/** 每个页面一个 <url>。 */
function urlEntry(origin: string, page: SitemapPage): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(`${origin}${sitePath(page.path)}`)}</loc>`,
    ...(page.lastmod ? [`    <lastmod>${escapeXml(page.lastmod)}</lastmod>`] : []),
    '  </url>',
  ].join('\n');
}

/** The sitemap of every public page: the sections, the Our People pages, every visible person, every published event and every reviewed course. */
/** 包含全部公开页面的站点地图：各板块、"我们的团队" 各页面、每位正在显示的成员、每个已发布的活动以及每门有复习的课程。 */
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
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map((page) => urlEntry(origin, page)),
    '</urlset>',
    '',
  ].join('\n');
}
