import { isSlug } from '@msc-web/content';
import { findPublishedEvent, listPastEvents, listUpcomingEvents } from '../../../../infrastructure/d1/public/events';
import { loadPageContext } from '../../../../pages/context';
import { renderNotFound } from '../../../../pages/errors/ErrorPages';
import { EventDetailView } from '../../../../pages/events/detail/EventDetailView';
import { eventDetailMeta } from '../../../../pages/events/detail/event-meta';
import { EventsListView, eventsListMeta } from '../../../../pages/events/list/EventsListView';
import { PAST_EVENTS_PAGE_SIZE, readEventsQuery } from '../../../../pages/events/list/events-query';
import { renderPage } from '../../../../pages/render';
import type { PageHandler } from '../page-handler';

export const eventsPage: PageHandler = async (c, locale) => {
  const query = readEventsQuery({ type: c.req.query('type'), page: c.req.query('page') });
  const ctx = await loadPageContext(c, locale);
  const [upcoming, past] = await Promise.all([
    listUpcomingEvents(c.env.DB, ctx.now, { category: query.category }),
    listPastEvents(c.env.DB, ctx.now, { category: query.category, page: query.page, pageSize: PAST_EVENTS_PAGE_SIZE }),
  ]);
  const data = { query, upcoming, past: past.events, pastTotal: past.total };
  return renderPage(c, ctx, eventsListMeta(ctx), <EventsListView ctx={ctx} data={data} />);
};

export const eventDetailPage: PageHandler = async (c, locale) => {
  const slug = c.req.param('slug');
  if (!isSlug(slug)) return renderNotFound(c, locale);
  const [ctx, event] = await Promise.all([loadPageContext(c, locale), findPublishedEvent(c.env.DB, slug)]);
  if (!event) return renderNotFound(c, locale);
  return renderPage(c, ctx, eventDetailMeta(event, locale), <EventDetailView ctx={ctx} event={event} />);
};
