import type {
  CourseInput,
  CourseResponse,
  CoursesResponse,
  DocumentResponse,
  DocumentsResponse,
  EventCategory,
  EventInput,
  EventPhoto,
  EventPhotoInput,
  EventPhotoResponse,
  EventResponse,
  EventsResponse,
  LoginRequest,
  LoginResponse,
  MediaKind,
  PeopleResponse,
  PersonInput,
  PersonResponse,
  PublishStatus,
  ReviewMaterialInput,
  ReviewMaterialResponse,
  ReviewSessionInput,
  ReviewSessionResponse,
  SessionOptionsResponse,
  SessionResponse,
  SettingsResponse,
  SettingsUpdateRequest,
  SiteDocumentInput,
  SiteSettings,
  SummaryResponse,
  UploadResponse,
  VersionedBody,
} from '@msc-web/content';
import { apiRequest } from './client';

/**
 * Typed calls for every admin API route. Paths here and the routers under apps/site/src/http/routes/admin must
 * agree; request bodies are checked against the shapes in @msc-web/content, so renaming a field there fails the
 * type check here.
 * 每个后台接口路由的类型化调用。这里的路径必须与 apps/site/src/http/routes/admin 下的路由一致；
 * 请求体按 @msc-web/content 中的结构进行类型检查，在那里重命名字段会使这里的类型检查失败。
 */

const id = (value: string) => encodeURIComponent(value);

export const sessionApi = {
  options: () => apiRequest<SessionOptionsResponse>('/session/options', { token: null }),
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/session/login', { method: 'POST', json: { email, password } satisfies LoginRequest, token: null }),
  current: (token: string) => apiRequest<SessionResponse>('/session', { token }),
  logout: (token: string) => apiRequest<void>('/session/logout', { method: 'POST', token }),
};

export const summaryApi = {
  get: () => apiRequest<SummaryResponse>('/summary'),
};

export const settingsApi = {
  get: () => apiRequest<SettingsResponse>('/settings'),
  save: (settings: SiteSettings, expectedUpdatedAt: string | null) =>
    apiRequest<SettingsResponse>('/settings', { method: 'PUT', json: { settings, expectedUpdatedAt } satisfies SettingsUpdateRequest }),
};

export const peopleApi = {
  list: () => apiRequest<PeopleResponse>('/people'),
  get: (personId: string) => apiRequest<PersonResponse>(`/people/${id(personId)}`),
  create: (input: PersonInput) => apiRequest<PersonResponse>('/people', { method: 'POST', json: input }),
  update: (personId: string, value: PersonInput, expectedUpdatedAt: string) =>
    apiRequest<PersonResponse>(`/people/${id(personId)}`, { method: 'PUT', json: { value, expectedUpdatedAt } satisfies VersionedBody<PersonInput> }),
  remove: (personId: string) => apiRequest<void>(`/people/${id(personId)}`, { method: 'DELETE' }),
};

/** The event list's filters; the list page keeps them in its own address with the same parameters. */
/** 活动列表的筛选条件；列表页面以相同的参数把它们保存在自己的地址中。 */
export interface EventListFilter {
  category?: EventCategory;
  status?: PublishStatus;
}

export function filterSearchParams(filter: EventListFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.category) params.set('category', filter.category);
  if (filter.status) params.set('status', filter.status);
  return params;
}

export const eventsApi = {
  list: (filter: EventListFilter = {}) => {
    const query = filterSearchParams(filter).toString();
    return apiRequest<EventsResponse>(`/events${query ? `?${query}` : ''}`);
  },
  get: (eventId: string) => apiRequest<EventResponse>(`/events/${id(eventId)}`),
  create: (input: EventInput) => apiRequest<EventResponse>('/events', { method: 'POST', json: input }),
  update: (eventId: string, value: EventInput, expectedUpdatedAt: string) =>
    apiRequest<EventResponse>(`/events/${id(eventId)}`, { method: 'PUT', json: { value, expectedUpdatedAt } satisfies VersionedBody<EventInput> }),
  remove: (eventId: string) => apiRequest<void>(`/events/${id(eventId)}`, { method: 'DELETE' }),
  addPhoto: (eventId: string, input: EventPhotoInput) => apiRequest<EventPhotoResponse>(`/events/${id(eventId)}/photos`, { method: 'POST', json: input }),
  updatePhoto: (eventId: string, photoId: string, value: Pick<EventPhoto, 'caption' | 'sortOrder'>) =>
    apiRequest<EventPhotoResponse>(`/events/${id(eventId)}/photos/${id(photoId)}`, { method: 'PUT', json: value }),
  removePhoto: (eventId: string, photoId: string) => apiRequest<void>(`/events/${id(eventId)}/photos/${id(photoId)}`, { method: 'DELETE' }),
};

export const coursesApi = {
  list: () => apiRequest<CoursesResponse>('/courses'),
  get: (courseId: string) => apiRequest<CourseResponse>(`/courses/${id(courseId)}`),
  create: (input: CourseInput) => apiRequest<CourseResponse>('/courses', { method: 'POST', json: input }),
  update: (courseId: string, value: CourseInput, expectedUpdatedAt: string) =>
    apiRequest<CourseResponse>(`/courses/${id(courseId)}`, { method: 'PUT', json: { value, expectedUpdatedAt } satisfies VersionedBody<CourseInput> }),
  remove: (courseId: string) => apiRequest<void>(`/courses/${id(courseId)}`, { method: 'DELETE' }),
  addSession: (courseId: string, input: ReviewSessionInput) =>
    apiRequest<ReviewSessionResponse>(`/courses/${id(courseId)}/sessions`, { method: 'POST', json: input }),
};

export const reviewSessionsApi = {
  get: (sessionId: string) => apiRequest<ReviewSessionResponse>(`/review-sessions/${id(sessionId)}`),
  update: (sessionId: string, value: ReviewSessionInput, expectedUpdatedAt: string) =>
    apiRequest<ReviewSessionResponse>(`/review-sessions/${id(sessionId)}`, { method: 'PUT', json: { value, expectedUpdatedAt } satisfies VersionedBody<ReviewSessionInput> }),
  remove: (sessionId: string) => apiRequest<void>(`/review-sessions/${id(sessionId)}`, { method: 'DELETE' }),
  addMaterial: (sessionId: string, input: ReviewMaterialInput) =>
    apiRequest<ReviewMaterialResponse>(`/review-sessions/${id(sessionId)}/materials`, { method: 'POST', json: input }),
  updateMaterial: (sessionId: string, materialId: string, input: ReviewMaterialInput) =>
    apiRequest<ReviewMaterialResponse>(`/review-sessions/${id(sessionId)}/materials/${id(materialId)}`, { method: 'PUT', json: input }),
  removeMaterial: (sessionId: string, materialId: string) =>
    apiRequest<void>(`/review-sessions/${id(sessionId)}/materials/${id(materialId)}`, { method: 'DELETE' }),
};

export const documentsApi = {
  list: () => apiRequest<DocumentsResponse>('/documents'),
  get: (documentId: string) => apiRequest<DocumentResponse>(`/documents/${id(documentId)}`),
  create: (input: SiteDocumentInput) => apiRequest<DocumentResponse>('/documents', { method: 'POST', json: input }),
  update: (documentId: string, value: SiteDocumentInput, expectedUpdatedAt: string) =>
    apiRequest<DocumentResponse>(`/documents/${id(documentId)}`, { method: 'PUT', json: { value, expectedUpdatedAt } satisfies VersionedBody<SiteDocumentInput> }),
  remove: (documentId: string) => apiRequest<void>(`/documents/${id(documentId)}`, { method: 'DELETE' }),
};

/** Uploads one file as the raw request body; the server checks its real type from the bytes. */
/** 以原始请求体上传一个文件；服务器根据字节内容检查其真实类型。 */
export function uploadMedia(file: Blob, kind: MediaKind, fileName: string) {
  const params = new URLSearchParams({ kind, name: fileName });
  return apiRequest<UploadResponse>(`/uploads?${params.toString()}`, { method: 'POST', raw: file });
}
