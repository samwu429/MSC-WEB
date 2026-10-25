import type { SitePermission, SummaryResponse } from '@msc-web/content';
import { visibleNavItems } from '../../../shared/navigation';

type SummaryCounts = SummaryResponse['counts'];

export interface SummaryCard {
  to: string;
  title: string;
  value: number;
  unit: string;
  detail: string | null;
}

type CardFigures = Pick<SummaryCard, 'value' | 'unit' | 'detail'>;

/** The figures shown for each section; site settings has nothing to count. */
/** 每个板块显示的数字；网站设置没有可统计的数量。 */
const SECTION_FIGURES: Partial<Record<SitePermission, (counts: SummaryCounts) => CardFigures>> = {
  'events.edit': (counts) => ({ value: counts.eventsPublished, unit: '场已发布', detail: `即将举行 ${counts.upcomingEvents} · 草稿 ${counts.eventsDraft}` }),
  'reviews.edit': (counts) => ({ value: counts.courses, unit: '门课程', detail: `复习场次 ${counts.reviewSessions}` }),
  'people.edit': (counts) => ({ value: counts.people, unit: '人', detail: null }),
  'documents.edit': (counts) => ({ value: counts.documents, unit: '份文件', detail: null }),
};

/**
 * One card for each section this officer may open, in sidebar order and with the sidebar's names, so every count
 * leads to a page the officer can act on.
 * 该干部可进入的每个板块各一张卡片，顺序与名称均与侧边栏一致，因此每个数字都指向干部能够操作的页面。
 */
export function summaryCards(counts: SummaryCounts, permissions: readonly SitePermission[]): SummaryCard[] {
  return visibleNavItems(permissions).flatMap((item) => {
    const figures = item.permission ? SECTION_FIGURES[item.permission] : undefined;
    return figures ? [{ to: item.to, title: item.label, ...figures(counts) }] : [];
  });
}
