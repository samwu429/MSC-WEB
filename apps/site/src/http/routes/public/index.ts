import { Hono } from 'hono';
import { LOCALES } from '@msc-web/content';
import { PEOPLE_PAGE_PATHS, localePath } from '../../../pages/routing/paths';
import type { AppEnv } from '../../context';
import { aboutPage } from './handlers/about';
import { coursePage, reviewsPage } from './handlers/reviews';
import { eventDetailPage, eventsPage } from './handlers/events';
import { homePage } from './handlers/home';
import { advisorsPage, departmentsPage, peoplePage, presidiumPage } from './handlers/people';
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
  { path: '/about', handler: aboutPage },
];

export const publicRoutes = new Hono<AppEnv>();

for (const locale of LOCALES) {
  for (const page of PUBLIC_PAGES) {
    publicRoutes.get(localePath(locale, page.path), (c) => page.handler(c, locale));
  }
}
