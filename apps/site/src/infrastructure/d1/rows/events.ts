import type { EventCategory, EventPhoto, PublishStatus, SiteEvent } from '@msc-web/content';

/** A row of the events table. */
/** events 表的一行。 */
export interface EventRow {
  id: string;
  slug: string;
  category: string;
  status: string;
  title_zh: string;
  title_en: string;
  summary_zh: string;
  summary_en: string;
  body_zh: string;
  body_en: string;
  location_zh: string;
  location_en: string;
  starts_at: string;
  ends_at: string | null;
  cover_key: string | null;
  registration_url: string | null;
  created_at: string;
  updated_at: string;
}

export function toSiteEvent(row: EventRow): SiteEvent {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category as EventCategory,
    status: row.status as PublishStatus,
    title: { zh: row.title_zh, en: row.title_en },
    summary: { zh: row.summary_zh, en: row.summary_en },
    body: { zh: row.body_zh, en: row.body_en },
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: { zh: row.location_zh, en: row.location_en },
    coverKey: row.cover_key,
    registrationUrl: row.registration_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** A row of the event_photos table. */
/** event_photos 表的一行。 */
export interface EventPhotoRow {
  id: string;
  event_id: string;
  media_key: string;
  caption_zh: string;
  caption_en: string;
  sort_order: number;
  created_at: string;
}

export function toEventPhoto(row: EventPhotoRow): EventPhoto {
  return {
    id: row.id,
    eventId: row.event_id,
    mediaKey: row.media_key,
    caption: { zh: row.caption_zh, en: row.caption_en },
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}
