import type { SiteEvent } from '@msc-web/content';
import type { PageContext } from '../../context';
import { EmptyState, SectionHeading } from '../../components/common';
import { t } from '../../i18n/strings';
import { SECTION_PATHS, sitePath } from '../../routing/paths';
import { EventCard } from '../../events/EventCard';
import { HOME } from '../strings';

export function UpcomingEventsSection({ ctx, events }: { ctx: PageContext; events: SiteEvent[] }) {
  const { locale } = ctx;
  return (
    <section class="section section--alt" aria-labelledby="home-events">
      <div class="container">
        <SectionHeading
          id="home-events"
          eyebrow={t(HOME, 'eventsEyebrow', locale)}
          title={HOME.upcomingEvents}
          link={{ href: sitePath(SECTION_PATHS.events), label: t(HOME, 'eventsLink', locale) }}
        />
        {events.length > 0 ? (
          <div class="grid grid--3">
            {events.map((event) => (
              <EventCard event={event} ctx={ctx} />
            ))}
          </div>
        ) : (
          <EmptyState title={HOME.eventsEmptyTitle} text={HOME.eventsEmptyText} />
        )}
      </div>
    </section>
  );
}
