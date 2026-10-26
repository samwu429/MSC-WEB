import { Hono } from 'hono';
import { LOCALES } from '@msc-web/content';
import { PEOPLE_PAGE_PATHS, localePath } from '../../../pages/routing/paths';
import type { AppEnv } from '../../context';
import { aboutPage } from './handlers/about';
import { coursePage, reviewsPage } from './handlers/reviews';
import { eventDetailPage, eventsPage } from './handlers/events';
import { homePage } from './handlers/home';
import { advisorsPage, departmentsPage, peoplePage, personPage, presidiumPage } from './handlers/people';
import type { PageHandler } from './page-handler';

/** Every public page by its locale-neutral path. */
/** 所有公开页面，按与语言无关的路径列出。 */
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

for (const locale of LOCALES) {
  for (const page of PUBLIC_PAGES) {
    publicRoutes.get(localePath(locale, page.path), (c) => page.handler(c, locale));
  }
}
