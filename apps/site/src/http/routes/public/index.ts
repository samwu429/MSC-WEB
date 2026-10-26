import { Hono } from 'hono';
import { SITE_LOCALE } from '../../../pages/context';
import { PEOPLE_PAGE_PATHS, legacyEnglishTarget } from '../../../pages/routing/paths';
import type { AppEnv } from '../../context';
import { aboutPage } from './handlers/about';
import { coursePage, reviewsPage } from './handlers/reviews';
import { eventDetailPage, eventsPage } from './handlers/events';
import { homePage } from './handlers/home';
import { advisorsPage, departmentsPage, peoplePage, personPage, presidiumPage } from './handlers/people';
import type { PageHandler } from './page-handler';

/** Every public page by its path. */
/** 所有公开页面，按路径列出。 */
export const PUBLIC_PAGES: readonly { path: string; handler: PageHandler }[] = [
  { path: '/', handler: homePage },
  { path: '/events', handler: eventsPage },
  { path: '/events/:slug', handler: eventDetailPage },
  { path: '/reviews', handler: reviewsPage },
  { path: '/reviews/:course', handler: coursePage },
  { path: '/people', handler: peoplePage },
  { path: PEOPLE_PAGE_PATHS.presidium, handler: presidiumPage },
  { path: PEOPLE_PAGE_PATHS.advisors, handler: advisorsPage },
  { path: PEOPLE_PAGE_PATHS.departments, handler: departmentsPage },
  // After the three group pages, so /people/presidium and the others never reach the person page.
  // 位于三个团体页面之后，因此 /people/presidium 等路径永远不会进入个人页面。
  { path: '/people/:id', handler: personPage },
  { path: '/about', handler: aboutPage },
];

export const publicRoutes = new Hono<AppEnv>();

/**
 * The English pages used to live under /en. Those addresses move permanently to the same path at the root, keeping
 * the query, so bookmarks and shared links still arrive.
 * 英文页面过去位于 /en 之下。这些地址永久移到根路径下的相同路径并保留查询参数，书签与分享过的链接因此仍能到达。
 */
publicRoutes.get('/en', (c) => c.redirect(`/${new URL(c.req.url).search}`, 301));
publicRoutes.get('/en/*', (c) => {
  const url = new URL(c.req.url);
  return c.redirect(`${legacyEnglishTarget(url.pathname) ?? '/'}${url.search}`, 301);
});

for (const page of PUBLIC_PAGES) {
  publicRoutes.get(page.path, (c) => page.handler(c, SITE_LOCALE));
}
