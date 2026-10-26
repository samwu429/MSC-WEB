import { Link } from 'react-router-dom';
import { EVENT_CATEGORY_LABELS, PUBLISH_STATUS_LABELS, type SiteEvent, type WallTime } from '@msc-web/content';
import { Badge } from '../../../shared/ui/feedback';
import { eventListTitle, formatWallTime, hasEnded } from './event-list';

const COLUMNS = 'md:grid md:grid-cols-[9.5rem_minmax(0,1fr)_15rem] md:items-center md:gap-4';

/** A table on wide screens; on phones each row stacks its time, title and badges. */
/** 宽屏上为表格；在手机上每行把时间、标题与标记上下排列。 */
export function EventRows({ events, now }: { events: readonly SiteEvent[]; now: WallTime }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className={`hidden border-b border-line bg-canvas/60 px-4 py-2 text-xs font-semibold text-ink-muted ${COLUMNS}`} aria-hidden="true">
        <span>开始时间</span>
        <span>标题</span>
        <span>状态</span>
      </div>
      <ul className="divide-y divide-line">
        {events.map((event) => (
          <li key={event.id}>
            <Link to={`/events/${event.id}`} className={`block px-4 py-3 transition-colors hover:bg-brand-50 ${COLUMNS}`}>
              <span className="block text-xs tabular-nums text-ink-muted md:text-sm">{formatWallTime(event.startsAt)}</span>
              <span className="mt-0.5 block font-semibold text-ink md:mt-0 md:truncate">{eventListTitle(event)}</span>
              <span className="mt-2 flex flex-wrap gap-1.5 md:mt-0">
                <Badge tone={event.category === 'academic' ? 'purple' : 'gold'}>{EVENT_CATEGORY_LABELS[event.category].zh}</Badge>
                <Badge tone={event.status === 'published' ? 'green' : 'gray'}>{PUBLISH_STATUS_LABELS[event.status].zh}</Badge>
                {event.archived ? <Badge tone="red">已归档</Badge> : hasEnded(event, now) && <Badge>已结束</Badge>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
