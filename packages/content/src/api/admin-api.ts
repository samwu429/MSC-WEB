import type { SitePermission } from '../access/site-permissions';
import type { LocalizedText } from '../locale/locale';
import type { MediaRecord } from '../media/media';
import type { SiteDocument } from '../documents/document';
import type { SiteEvent, SiteEventDetail, EventPhoto } from '../events/event';
import type { Person } from '../people/person';
import type { Course } from '../reviews/course';
import type { ReviewMaterial } from '../reviews/material';
import type { ReviewSessionDetail } from '../reviews/session';
import type { SiteSettings } from '../settings/site-settings';
import type { ValidationIssue } from '../validation/issues';

/**
 * The contract between the admin app and the site Worker. Every path is under /admin/api, because utmmsc.com/api
 * already belongs to the member network's API. Requests carry the member network session as a bearer token.
 * 后台应用与网站 Worker 之间的约定。所有路径都在 /admin/api 之下，因为 utmmsc.com/api 已属于成员网络的接口。
 * 请求以 Bearer 令牌携带成员网络的会话。
 */
export const ADMIN_API_PREFIX = '/admin/api';

/** Whether a request path is the admin API: the prefix itself or anything under it, never a sibling such as /admin/apiary. */
/** 请求路径是否属于后台接口：前缀本身或其下的任何路径，不包括 /admin/apiary 这样的同级路径。 */
export function isAdminApiPath(pathname: string): boolean {
  return pathname === ADMIN_API_PREFIX || pathname.startsWith(`${ADMIN_API_PREFIX}/`);
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    issues?: ValidationIssue[];
  };
}

/** Who is signed in to the backend and what they may edit. */
/** 当前登录后台的人及其可编辑的内容。 */
export interface AdminIdentity {
  memberId: string;
  displayName: string;
  role: string;
  roleLabel: LocalizedText;
  permissions: SitePermission[];
  /** "developer" only on a local machine with DEV_ADMIN_TOKEN set. */
  /** 仅在本地设置了 DEV_ADMIN_TOKEN 时为 "developer"。 */
  source: 'member' | 'developer';
}

export interface SessionOptionsResponse {
  /** Whether this server accepts the local developer token (local development only). */
  /** 服务器是否接受本地开发令牌（仅限本地开发）。 */
  developerSignIn: boolean;
  /** The member network, where officers register and reset passwords. */
  /** 成员网络，干部在那里注册和重置密码。 */
  memberAppUrl: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string | null;
  identity: AdminIdentity;
}

export interface SessionResponse {
  identity: AdminIdentity;
}

export interface ChangeLogEntry {
  id: string;
  at: string;
  memberId: string;
  memberName: string;
  action: 'create' | 'update' | 'delete';
  entity: 'settings' | 'person' | 'event' | 'event_photo' | 'course' | 'review_session' | 'review_material' | 'document';
  entityId: string;
  /** A short human label such as the title at the time of the change. */
  /** 简短的可读标签，例如修改时的标题。 */
  summary: string;
}

export interface SummaryResponse {
  counts: {
    people: number;
    eventsPublished: number;
    eventsDraft: number;
    upcomingEvents: number;
    courses: number;
    reviewSessions: number;
    documents: number;
  };
  recentChanges: ChangeLogEntry[];
}

export interface SettingsResponse {
  settings: SiteSettings;
  /** Null until the first save; the form then sends null back as its expected version. */
  /** 首次保存之前为空；表单保存时将空值作为期望版本发回。 */
  updatedAt: string | null;
}

export interface SettingsUpdateRequest {
  settings: SiteSettings;
  expectedUpdatedAt: string | null;
}

export interface PeopleResponse {
  people: Person[];
}

export interface PersonResponse {
  person: Person;
}

export interface EventsResponse {
  events: SiteEvent[];
}

export interface EventResponse {
  event: SiteEventDetail;
}

export interface EventPhotoResponse {
  photo: EventPhoto;
}

/** A course with how many sessions it has, for the course list. */
/** 附带场次数量的课程，用于课程列表。 */
export interface CourseSummary extends Course {
  sessionCount: number;
  publishedSessionCount: number;
}

export interface CoursesResponse {
  courses: CourseSummary[];
}

export interface CourseResponse {
  course: Course;
  sessions: ReviewSessionDetail[];
}

export interface ReviewSessionResponse {
  session: ReviewSessionDetail;
}

export interface ReviewMaterialResponse {
  material: ReviewMaterial;
}

export interface DocumentsResponse {
  documents: SiteDocument[];
}

export interface DocumentResponse {
  document: SiteDocument;
}

export interface UploadResponse {
  media: MediaRecord;
}

/**
 * Body of every PUT that edits an existing record: the full new value and the updatedAt the editor loaded. A
 * different stored updatedAt means someone else saved first, and the server answers 409 "stale".
 * 编辑已有记录的每个 PUT 请求体：完整的新值，以及编辑者加载时的 updatedAt。若库中的 updatedAt 不同，说明已有他人先保存，服务器返回 409 "stale"。
 */
export interface VersionedBody<T> {
  value: T;
  expectedUpdatedAt: string;
}
