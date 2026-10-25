import type { SitePermission } from '@msc-web/content';

/**
 * Sidebar entries. Each section appears only for officers whose role grants its permission, matching the guards
 * on the server; the dashboard is open to every officer.
 * 侧边栏条目。每个板块只对拥有相应权限的干部显示，与服务器端的权限检查一致；概览对所有干部开放。
 */
export interface NavItem {
  to: string;
  label: string;
  description: string;
  permission: SitePermission | null;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: '概览', description: '数量统计与最近修改', permission: null },
  { to: '/events', label: '活动', description: '学术活动与课外活动', permission: 'events.edit' },
  { to: '/reviews', label: '考前复习', description: '课程、期中与期末复习场次、资料', permission: 'reviews.edit' },
  { to: '/people', label: '我们的团队', description: '主席团、部长团与荣誉顾问', permission: 'people.edit' },
  { to: '/documents', label: '公开文件', description: '章程、公开账目、选举结果', permission: 'documents.edit' },
  { to: '/settings', label: '网站设置', description: '首页文案、联系方式与公告栏', permission: 'settings.edit' },
];

export function visibleNavItems(permissions: readonly SitePermission[]): NavItem[] {
  return NAV_ITEMS.filter((item) => item.permission === null || permissions.includes(item.permission));
}
