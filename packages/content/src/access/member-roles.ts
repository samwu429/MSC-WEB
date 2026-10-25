import type { LocalizedText } from '../locale/locale';

/**
 * Roles as the UTMMSC member network assigns them (packages/shared/src/identity/roles.ts in that repository).
 * The website never assigns roles; it only reads the role of the signed-in member, so this list must follow the
 * member network when an office is added there. An unknown role grants nothing.
 * UTMMSC 成员网络所分配的身份（见该仓库 packages/shared/src/identity/roles.ts）。官网从不分配身份，只读取登录成员的身份，
 * 因此成员网络新增职位时，这里的列表必须同步更新。未知身份没有任何权限。
 */
export const MEMBER_ROLES = [
  'student',
  'alumni',
  'honorary_alumni',
  'honorary_external',
  'head_technology',
  'head_academic',
  'head_publicity',
  'head_sponsorship',
  'head_events',
  'secretary_general',
  'vp_finance',
  'vp_audit',
  'president',
  'superadmin',
] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export function isMemberRole(value: unknown): value is MemberRole {
  return typeof value === 'string' && (MEMBER_ROLES as readonly string[]).includes(value);
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, LocalizedText> = {
  student: { zh: '在校生', en: 'Student' },
  alumni: { zh: '毕业生', en: 'Alumni' },
  honorary_alumni: { zh: '校友荣誉顾问', en: 'Honorary Advisor (Alumni)' },
  honorary_external: { zh: '校外荣誉顾问', en: 'Honorary Advisor (External)' },
  head_technology: { zh: '科技部部长', en: 'Head of Technology' },
  head_academic: { zh: '学术部部长', en: 'Head of Academic' },
  head_publicity: { zh: '宣传部部长', en: 'Head of Publicity' },
  head_sponsorship: { zh: '赞助部部长', en: 'Head of Sponsorship' },
  head_events: { zh: '活动部部长', en: 'Head of Events' },
  secretary_general: { zh: '秘书长', en: 'Secretary-General' },
  vp_finance: { zh: '财务副主席', en: 'Vice-President Finance' },
  vp_audit: { zh: '监督审计副主席', en: 'Vice-President Supervision & Audit' },
  president: { zh: '主席', en: 'President' },
  superadmin: { zh: '系统管理员', en: 'System Administrator' },
};
