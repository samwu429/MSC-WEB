import { isMemberRole, type MemberRole } from './member-roles';

/**
 * What a signed-in officer may edit on the website. The table follows the constitution: the President, the
 * Secretary-General (who keeps the archives and website documents, Article 4.4) and the Technology Department
 * (which maintains the website, Article 4.2(a)) edit everything; each Department Head edits the part their
 * department runs; the two Vice-Presidents publish the public accounts and archive records (Articles 11 and 13.7).
 * Members without an office cannot open the editing backend.
 * 已登录的干部可以在官网编辑的内容。此表依据章程：主席、秘书长（负责档案与官网文件，第 4.4 条）与科技部（负责官网，第 4.2(a) 条）可编辑全部内容；
 * 各部部长编辑本部门负责的部分；两位副主席发布公开账目与档案记录（第 11 条与第 13.7 条）。没有职位的成员无法进入编辑后台。
 */

export const SITE_PERMISSIONS = ['settings.edit', 'people.edit', 'events.edit', 'reviews.edit', 'documents.edit'] as const;

export type SitePermission = (typeof SITE_PERMISSIONS)[number];

const EVERYTHING: readonly SitePermission[] = SITE_PERMISSIONS;
const NOTHING: readonly SitePermission[] = [];

export const ROLE_SITE_PERMISSIONS: Record<MemberRole, readonly SitePermission[]> = {
  student: NOTHING,
  alumni: NOTHING,
  honorary_alumni: NOTHING,
  honorary_external: NOTHING,
  head_technology: EVERYTHING,
  head_academic: ['reviews.edit', 'events.edit'],
  head_publicity: ['settings.edit', 'events.edit'],
  head_sponsorship: ['events.edit'],
  head_events: ['events.edit'],
  secretary_general: EVERYTHING,
  vp_finance: ['documents.edit'],
  vp_audit: ['documents.edit'],
  president: EVERYTHING,
  superadmin: EVERYTHING,
};

/** Permissions for a role string from the member network. Unknown roles get none. */
/** 成员网络返回的身份字符串所对应的权限。未知身份没有权限。 */
export function sitePermissionsFor(role: unknown): SitePermission[] {
  return isMemberRole(role) ? [...ROLE_SITE_PERMISSIONS[role]] : [];
}

/** Whether a role may open the editing backend at all. */
/** 某个身份能否进入编辑后台。 */
export function canUseAdmin(role: unknown): boolean {
  return sitePermissionsFor(role).length > 0;
}
