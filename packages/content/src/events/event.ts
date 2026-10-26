import type { LocalizedText } from '../locale/locale';
import { PUBLISH_STATUSES, type PublishStatus } from '../publishing/status';
import { timeStatus, type TimeStatus } from '../time/schedule';
import type { WallTime } from '../time/toronto';
import { IssueCollector, asRecord, type ValidationResult } from '../validation/issues';
import {
  checkTimeOrder,
  readBoolean,
  readEnum,
  readInteger,
  readLocalizedText,
  readOptionalMediaKey,
  readOptionalUrl,
  readOptionalWallTime,
  readRequiredMediaKey,
  readWallTime,
} from '../validation/fields';
import { readSlug } from './slug';

/**
 * Events are split the way members look for them: academic activities (talks, workshops, research and writing
 * mentorship) and extracurricular activities (socials, cultural and interest events). Test reviews have their
 * own section of the site and are not events.
 * 活动按成员查找的方式分为两类：学术活动（讲座、工作坊、科研与写作指导）与课外活动（社交、文化与兴趣活动）。
 * 考前复习在网站上有独立板块，不属于活动。
 */
export const EVENT_CATEGORIES = ['academic', 'extracurricular'] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, LocalizedText> = {
  academic: { zh: '学术活动', en: 'Academic' },
  extracurricular: { zh: '课外活动', en: 'Extracurricular' },
};

export interface SiteEvent {
  id: string;
  slug: string;
  category: EventCategory;
  status: PublishStatus;
  title: LocalizedText;
  /** One or two sentences for cards and search results. */
  /** 一两句话的简介，用于卡片与搜索结果。 */
  summary: LocalizedText;
  /** Plain text with blank lines between paragraphs; links are recognised when shown. */
  /** 纯文本，段落之间空一行；显示时会识别链接。 */
  body: LocalizedText;
  startsAt: WallTime;
  endsAt: WallTime | null;
  location: LocalizedText;
  coverKey: string | null;
  registrationUrl: string | null;
  /** Marked as ended by an officer: listed with past events whatever its date, and no longer taking sign-ups. */
  /** 由干部标记为已结束：无论日期如何都列在往期活动中，并且不再接受报名。 */
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** An event with its photo gallery, as the detail page and the editor load it. */
/** 带相册的活动，供详情页与编辑页加载。 */
export interface SiteEventDetail extends SiteEvent {
  photos: EventPhoto[];
}

export interface EventPhoto {
  id: string;
  eventId: string;
  mediaKey: string;
  caption: LocalizedText;
  sortOrder: number;
  createdAt: string;
}

/** Slug may be empty on create; the server then derives one from the English title and the date. */
/** 创建时 slug 可以为空；服务器会根据英文标题与日期生成。 */
export type EventInput = Omit<SiteEvent, 'id' | 'createdAt' | 'updatedAt'>;

export type EventPhotoInput = Pick<EventPhoto, 'mediaKey' | 'caption' | 'sortOrder'>;

export const EVENT_LIMITS = {
  title: 120,
  summary: 300,
  body: 10000,
  location: 120,
  caption: 200,
  /** Photos per event gallery, so the public event page stays quick to load on a phone. */
  /** 每个活动相册的照片数量上限，使公开活动页面在手机上也能快速加载。 */
  photos: 60,
} as const;

/** Where an event stands: as its time says, except that one an officer marked as ended has ended. */
/** 活动所处的状态：按时间判断；但被干部标记为已结束的活动一律视为已结束。 */
export function eventStatus(event: Pick<SiteEvent, 'startsAt' | 'endsAt' | 'archived'>, now: WallTime): TimeStatus {
  return event.archived ? 'past' : timeStatus(event.startsAt, event.endsAt, now);
}

export function validateEventInput(raw: unknown): ValidationResult<EventInput> {
  const issues = new IssueCollector();
  const body = asRecord(raw);
  const startsAt = readWallTime(issues, body.startsAt, 'startsAt', '开始时间');
  const endsAt = readOptionalWallTime(issues, body.endsAt, 'endsAt', '结束时间');
  checkTimeOrder(issues, startsAt || null, endsAt, 'endsAt');
  const value: EventInput = {
    slug: readSlug(issues, body.slug, 'slug'),
    category: readEnum(issues, body.category, 'category', EVENT_CATEGORIES, '活动类别'),
    status: readEnum(issues, body.status, 'status', PUBLISH_STATUSES, '发布状态'),
    title: readLocalizedText(issues, body.title, 'title', { label: '标题', max: EVENT_LIMITS.title, required: true }),
    summary: readLocalizedText(issues, body.summary, 'summary', { label: '简介', max: EVENT_LIMITS.summary, multiline: true }),
    body: readLocalizedText(issues, body.body, 'body', { label: '正文', max: EVENT_LIMITS.body, multiline: true }),
    startsAt,
    endsAt,
    location: readLocalizedText(issues, body.location, 'location', { label: '地点', max: EVENT_LIMITS.location }),
    coverKey: readOptionalMediaKey(issues, body.coverKey, 'coverKey', 'image', '封面图片'),
    registrationUrl: readOptionalUrl(issues, body.registrationUrl, 'registrationUrl', { label: '报名链接' }),
    archived: readBoolean(issues, body.archived, 'archived', '是否已结束', false),
  };
  return issues.result(value);
}

export function validateEventPhotoInput(raw: unknown): ValidationResult<EventPhotoInput> {
  const issues = new IssueCollector();
  const body = asRecord(raw);
  const value: EventPhotoInput = {
    mediaKey: readRequiredMediaKey(issues, body.mediaKey, 'mediaKey', 'image', '照片'),
    caption: readLocalizedText(issues, body.caption, 'caption', { label: '照片说明', max: EVENT_LIMITS.caption }),
    sortOrder: readInteger(issues, body.sortOrder, 'sortOrder', { label: '排序', min: 0, max: 9999, fallback: 0 }),
  };
  return issues.result(value);
}

/** Only the caption and order of a photo change after upload; a different picture is a new photo. */
/** 照片上传后只能修改说明与排序；换一张图就是新照片。 */
export function validateEventPhotoUpdate(raw: unknown): ValidationResult<Pick<EventPhoto, 'caption' | 'sortOrder'>> {
  const issues = new IssueCollector();
  const body = asRecord(raw);
  const value = {
    caption: readLocalizedText(issues, body.caption, 'caption', { label: '照片说明', max: EVENT_LIMITS.caption }),
    sortOrder: readInteger(issues, body.sortOrder, 'sortOrder', { label: '排序', min: 0, max: 9999, fallback: 0 }),
  };
  return issues.result(value);
}
