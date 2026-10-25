import type { Locale, LocalizedText } from '@msc-web/content';

/** Fixed text of the events list, the event pages and event cards wherever they appear. */
/** 活动列表、活动详情页以及各处活动卡片使用的固定文字。 */
export const EVENTS = {
  heroEyebrow: { zh: 'UTMMSC 活动', en: 'UTMMSC events' },
  heroLead: {
    zh: '从学术讲座、工作坊到节日聚会与兴趣活动，联盟全年为同学们举办各类活动，欢迎每一位同学参加。',
    en: 'From academic talks and workshops to festival gatherings and interest groups, we host events all year round, and every student is welcome.',
  },
  categoryTabsLabel: { zh: '活动类别', en: 'Event categories' },
  allCategories: { zh: '全部', en: 'All' },
  upcomingTitle: { zh: '近期活动', en: 'Upcoming events' },
  upcomingLead: { zh: '正在进行和即将举行的活动。', en: 'Events happening now and coming up soon.' },
  upcomingEmptyTitle: { zh: '暂时没有即将举行的活动', en: 'No upcoming events right now' },
  upcomingEmptyText: { zh: '新活动发布后会第一时间出现在这里。', en: 'New events will appear here as soon as they are announced.' },
  pastTitle: { zh: '往期活动', en: 'Past events' },
  pastLead: { zh: '回顾联盟举办过的活动。', en: 'A look back at the events we have hosted.' },
  pastEmptyTitle: { zh: '还没有往期活动', en: 'No past events yet' },
  pageEmptyTitle: { zh: '这一页没有更多活动', en: 'There are no more events on this page' },
  pageEmptyText: { zh: '请返回上一页继续浏览。', en: 'Go back to the previous page to keep browsing.' },
  pagerLabel: { zh: '往期活动分页', en: 'Past event pages' },
  previousPage: { zh: '上一页', en: 'Previous' },
  nextPage: { zh: '下一页', en: 'Next' },
  backToEvents: { zh: '全部活动', en: 'All events' },
  detailsLabel: { zh: '活动信息', en: 'Event details' },
  dateAndTime: { zh: '日期与时间', en: 'Date and time' },
  location: { zh: '地点', en: 'Location' },
  category: { zh: '类别', en: 'Category' },
  registerNow: { zh: '立即报名', en: 'Register now' },
  photosTitle: { zh: '活动照片', en: 'Photos' },
  photo: { zh: '照片', en: 'Photo' },
} satisfies Record<string, LocalizedText>;

/** "第 2 页，共 5 页" or "Page 2 of 5". */
/** "第 2 页，共 5 页" 或 "Page 2 of 5"。 */
export function pageStatus(page: number, totalPages: number, locale: Locale): string {
  return locale === 'zh' ? `第 ${page} 页，共 ${totalPages} 页` : `Page ${page} of ${totalPages}`;
}
