import type {
  Course,
  DeliveryMode,
  ExamKind,
  MaterialKind,
  PublishStatus,
  ReviewMaterial,
  ReviewSession,
  TermKey,
} from '@msc-web/content';
import { fromFlag } from '../records';

/** A row of the courses table. */
/** courses 表的一行。 */
export interface CourseRow {
  id: string;
  code: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  sort_order: number;
  visible: number;
  created_at: string;
  updated_at: string;
}

export function toCourse(row: CourseRow): Course {
  return {
    id: row.id,
    code: row.code,
    title: { zh: row.title_zh, en: row.title_en },
    description: { zh: row.description_zh, en: row.description_en },
    sortOrder: row.sort_order,
    visible: fromFlag(row.visible),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** A row of the review_sessions table. */
/** review_sessions 表的一行。 */
export interface ReviewSessionRow {
  id: string;
  course_id: string;
  term: string;
  exam: string;
  status: string;
  title_zh: string;
  title_en: string;
  starts_at: string | null;
  ends_at: string | null;
  mode: string;
  location_zh: string;
  location_en: string;
  presenters: string;
  registration_url: string | null;
  recording_url: string | null;
  notes_zh: string;
  notes_en: string;
  created_at: string;
  updated_at: string;
}

export function toReviewSession(row: ReviewSessionRow): ReviewSession {
  return {
    id: row.id,
    courseId: row.course_id,
    term: row.term as TermKey,
    exam: row.exam as ExamKind,
    status: row.status as PublishStatus,
    title: { zh: row.title_zh, en: row.title_en },
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    mode: row.mode as DeliveryMode,
    location: { zh: row.location_zh, en: row.location_en },
    presenters: row.presenters,
    registrationUrl: row.registration_url,
    recordingUrl: row.recording_url,
    notes: { zh: row.notes_zh, en: row.notes_en },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** A row of the review_materials table. */
/** review_materials 表的一行。 */
export interface ReviewMaterialRow {
  id: string;
  session_id: string;
  kind: string;
  label_zh: string;
  label_en: string;
  media_key: string | null;
  url: string | null;
  sort_order: number;
  created_at: string;
}

export function toReviewMaterial(row: ReviewMaterialRow): ReviewMaterial {
  return {
    id: row.id,
    sessionId: row.session_id,
    kind: row.kind as MaterialKind,
    label: { zh: row.label_zh, en: row.label_en },
    mediaKey: row.media_key,
    url: row.url,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}
