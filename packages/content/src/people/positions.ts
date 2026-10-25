import type { LocalizedText } from '../locale/locale';

/**
 * The structure of "Our People" follows the constitution: the four-officer Presidium (Article 4.1), the five
 * Departments each led by a Head with optional Vice Heads (Article 4.2), and Honorary Advisors (Article 4.3).
 * The public page always shows every office, so a vacant one reads "to be announced" instead of disappearing.
 * "我们的团队" 的结构依据章程：四人主席团（第 4.1 条）、由部长领导并可设副部长的五个部门（第 4.2 条），以及荣誉顾问（第 4.3 条）。
 * 公开页面始终列出每个职位，空缺的职位显示 "待公布"，而不是直接消失。
 */

export const PEOPLE_SECTIONS = ['presidium', 'department', 'advisor'] as const;

export type PeopleSection = (typeof PEOPLE_SECTIONS)[number];

export const PRESIDIUM_POSITIONS = ['president', 'secretary_general', 'vp_finance', 'vp_audit'] as const;

export type PresidiumPosition = (typeof PRESIDIUM_POSITIONS)[number];

export const DEPARTMENTS = ['technology', 'academic', 'publicity', 'sponsorship', 'events'] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DEPARTMENT_POSITIONS = ['head', 'vice_head'] as const;

export type DepartmentPosition = (typeof DEPARTMENT_POSITIONS)[number];

export type PersonPosition = PresidiumPosition | DepartmentPosition | 'advisor';

export const PEOPLE_SECTION_LABELS: Record<PeopleSection, LocalizedText> = {
  presidium: { zh: '主席团', en: 'Presidium' },
  department: { zh: '部长团', en: 'Department Leads' },
  advisor: { zh: '荣誉顾问', en: 'Honorary Advisors' },
};

export const PRESIDIUM_POSITION_LABELS: Record<PresidiumPosition, LocalizedText> = {
  president: { zh: '主席', en: 'President' },
  secretary_general: { zh: '秘书长', en: 'Secretary-General' },
  vp_finance: { zh: '财务副主席', en: 'Vice-President Finance' },
  vp_audit: { zh: '监督审计副主席', en: 'Vice-President Supervision & Audit' },
};

/** Duties from Article 4.4, shown under each Presidium office. */
/** 第 4.4 条规定的职责，显示在每个主席团职位下方。 */
export const PRESIDIUM_POSITION_DUTIES: Record<PresidiumPosition, LocalizedText> = {
  president: {
    zh: '统筹联盟运作，担任发言人，主持主席团会议与全体大会。',
    en: 'Oversees the Group, acts as spokesperson, and presides over Presidium and general meetings.',
  },
  secretary_general: {
    zh: '维护成员名单，记录会议纪要，负责对外联络、档案与官网文件。',
    en: 'Keeps the membership list and minutes, handles correspondence, and coordinates archives and website records.',
  },
  vp_finance: {
    zh: '记录全部收支，编制预算，与主席共同负责财务签字。',
    en: 'Records every transaction, prepares budgets, and shares financial signing authority with the President.',
  },
  vp_audit: {
    zh: '监督财务与档案的完整性，审阅账目与选举记录，独立于主席团票选。',
    en: 'Supervises financial and archival integrity and reviews accounts and election records, independent of the ticket.',
  },
};

export const DEPARTMENT_LABELS: Record<Department, LocalizedText> = {
  technology: { zh: '科技部', en: 'Technology Department' },
  academic: { zh: '学术部', en: 'Academic Department' },
  publicity: { zh: '宣传部', en: 'Publicity Department' },
  sponsorship: { zh: '赞助部', en: 'Sponsorship Department' },
  events: { zh: '活动部', en: 'Events Department' },
};

/** Remits from Article 4.2. */
/** 第 4.2 条规定的部门职能。 */
export const DEPARTMENT_DESCRIPTIONS: Record<Department, LocalizedText> = {
  technology: {
    zh: '管理联盟的 GitHub 组织，带领成员完成能积累职业与科研经验的项目，共同建设官网与系统。',
    en: "Manages the Group's GitHub organization, leads member projects that build career and research experience, and builds the website and systems.",
  },
  academic: {
    zh: '指导课外科研与学术写作，提供写作与技术方面的同伴支持，帮助中文学习与学业过渡，并组织考前复习。不代写。',
    en: 'Mentors extracurricular research and scholarly writing, offers writing and technical peer support, supports Mandarin learning and academic transition, and runs test reviews. No ghostwriting.',
  },
  publicity: {
    zh: '运营社交媒体，回复成员咨询，并负责每年的招新。',
    en: 'Runs social media, answers member inquiries, and leads annual recruitment.',
  },
  sponsorship: {
    zh: '寻找校外赞助，并审查赞助方是否符合学校政策与章程。',
    en: 'Seeks external sponsorship and reviews sponsor compliance with University policy and the Constitution.',
  },
  events: {
    zh: '策划以兴趣为主题的各类活动。',
    en: 'Plans interest-based activities and events.',
  },
};

export const DEPARTMENT_POSITION_LABELS: Record<DepartmentPosition, LocalizedText> = {
  head: { zh: '部长', en: 'Head' },
  vice_head: { zh: '副部长', en: 'Vice Head' },
};

export const ADVISOR_LABEL: LocalizedText = { zh: '荣誉顾问', en: 'Honorary Advisor' };

/** The office title shown when an entry has no custom title, such as "学术部部长" or "Head of Academic". */
/** 条目没有自定义头衔时显示的职位名称，例如 "学术部部长" 或 "Head of Academic"。 */
export function defaultPositionTitle(position: PersonPosition, department: Department | null): LocalizedText {
  if (position === 'advisor') return ADVISOR_LABEL;
  if (position === 'head' || position === 'vice_head') {
    const dept = department ? DEPARTMENT_LABELS[department] : { zh: '', en: '' };
    const deptShort = dept.en.replace(/ Department$/, '');
    return position === 'head'
      ? { zh: `${dept.zh}部长`, en: `Head of ${deptShort}` }
      : { zh: `${dept.zh}副部长`, en: `Vice Head of ${deptShort}` };
  }
  return PRESIDIUM_POSITION_LABELS[position];
}

/** Which section a position belongs to. */
/** 某个职位属于哪个分组。 */
export function sectionOfPosition(position: PersonPosition): PeopleSection {
  if (position === 'advisor') return 'advisor';
  if (position === 'head' || position === 'vice_head') return 'department';
  return 'presidium';
}

/** Offices one person holds at a time: each Presidium office and each Department Head. Vice Heads and advisors may be many. */
/** 同一时间只能由一人担任的职位：每个主席团职位与每位部长。副部长与荣誉顾问可以有多人。 */
export function isSingleHolderPosition(position: PersonPosition): boolean {
  return position !== 'vice_head' && position !== 'advisor';
}
