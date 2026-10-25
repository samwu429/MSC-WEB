import type { LocalizedText } from '@msc-web/content';

/** Fixed text of the Our People pages and of person cards wherever they appear. */
/** "我们的团队" 各页面以及各处成员卡片使用的固定文字。 */
export const PEOPLE = {
  heroEyebrow: { zh: 'UTMMSC 团队', en: 'The UTMMSC team' },
  heroLead: {
    zh: '联盟由主席团、五个部门的部长团与荣誉顾问组成，均依照章程第四条设立。',
    en: 'The Group is made up of the Presidium, the leads of its five Departments and its Honorary Advisors, as set out in Article 4 of the constitution.',
  },
  presidiumEyebrow: { zh: '章程第 4.1 条', en: 'Article 4.1' },
  presidiumLead: {
    zh: '主席团由四位干部组成，共同统筹联盟的运作。',
    en: 'Four officers who lead the Group together.',
  },
  departmentsEyebrow: { zh: '章程第 4.2 条', en: 'Article 4.2' },
  departmentsLead: {
    zh: '五个部门各由一位部长领导，并可设副部长。每位成员最多可以加入两个部门。',
    en: 'Each of the five Departments is led by a Head, with Vice Heads where needed. Every member may join up to two Departments.',
  },
  advisorsEyebrow: { zh: '章程第 4.3 条', en: 'Article 4.3' },
  advisorsLead: {
    zh: '荣誉顾问由杰出校友、教师与业界人士担任，通过讲座与指导支持成员成长。荣誉顾问不享有表决权。',
    en: 'Honorary Advisors are distinguished alumni, faculty and practitioners who support members through talks and mentorship. They hold no voting rights.',
  },
  subnavLabel: { zh: '团队页面', en: 'Team pages' },
  hubCardLink: { zh: '查看', en: 'View' },
  advisorsHubNote: { zh: '杰出校友 · 教师 · 业界人士', en: 'Alumni · Faculty · Practitioners' },
  advisorsEmptyTitle: { zh: '荣誉顾问名单即将公布', en: 'Our Honorary Advisors will be announced soon' },
  advisorsEmptyText: { zh: '欢迎关注联盟的讲座与活动。', en: 'Follow our talks and events in the meantime.' },
  profileLink: { zh: '个人主页', en: 'Profile' },
} satisfies Record<string, LocalizedText>;
