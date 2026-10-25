import type { LocalizedText } from '../locale/locale';

/**
 * Events and review sessions are written as drafts and appear on the public site only once published.
 * 活动与复习场次先以草稿撰写，发布后才会出现在公开网站上。
 */
export const PUBLISH_STATUSES = ['draft', 'published'] as const;

export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, LocalizedText> = {
  draft: { zh: '草稿', en: 'Draft' },
  published: { zh: '已发布', en: 'Published' },
};
