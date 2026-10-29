import { hasText, type LocalizedText } from '../locale/locale';
import { IssueCollector, asRecord, type ValidationResult } from '../validation/issues';
import {
  readBoolean,
  readEnum,
  readInteger,
  readLocalizedText,
  readOptionalEmail,
  readOptionalMediaKey,
  readOptionalUrl,
} from '../validation/fields';
import {
  DEPARTMENTS,
  DEPARTMENT_POSITIONS,
  PEOPLE_SECTIONS,
  PRESIDIUM_POSITIONS,
  defaultPositionTitle,
  type Department,
  type PeopleSection,
  type PersonPosition,
} from './positions';

/** One person on the "Our People" page. */
/** "我们的团队" 页面上的一位成员。 */
export interface Person {
  id: string;
  section: PeopleSection;
  position: PersonPosition;
  /** Set only for the department section. */
  /** 仅部门分组填写。 */
  department: Department | null;
  name: LocalizedText;
  /** Custom title; empty uses the office title, such as "学术部部长". */
  /** 自定义头衔；留空时使用职位名称，例如 "学术部部长"。 */
  title: LocalizedText;
  /** Program and year for students, or position and organization for advisors. */
  /** 学生填写专业与年级，荣誉顾问填写职位与单位。 */
  affiliation: LocalizedText;
  bio: LocalizedText;
  photoKey: string | null;
  email: string | null;
  linkUrl: string | null;
  sortOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PersonInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>;

export const PERSON_LIMITS = {
  name: 60,
  title: 60,
  affiliation: 120,
  bio: 1000,
} as const;

/** Reads a person from untrusted JSON and checks that section, position and department agree. */
/** 从不可信的 JSON 中读取一位成员，并检查分组、职位与部门是否一致。 */
export function validatePersonInput(raw: unknown): ValidationResult<PersonInput> {
  const issues = new IssueCollector();
  const body = asRecord(raw);
  const section = readEnum(issues, body.section, 'section', PEOPLE_SECTIONS, '分组');

  let position: PersonPosition = 'advisor';
  let department: Department | null = null;
  if (section === 'presidium') {
    position = readEnum(issues, body.position, 'position', PRESIDIUM_POSITIONS, '主席团职位');
  } else if (section === 'department') {
    position = readEnum(issues, body.position, 'position', DEPARTMENT_POSITIONS, '部门职位');
    department = readEnum(issues, body.department, 'department', DEPARTMENTS, '部门');
  } else if (body.position !== undefined && body.position !== 'advisor') {
    issues.add('position', '荣誉顾问的职位只能是荣誉顾问');
  }

  const value: PersonInput = {
    section,
    position,
    department,
    name: readLocalizedText(issues, body.name, 'name', { label: '姓名', max: PERSON_LIMITS.name }),
    title: readLocalizedText(issues, body.title, 'title', { label: '头衔', max: PERSON_LIMITS.title }),
    affiliation: readLocalizedText(issues, body.affiliation, 'affiliation', { label: '专业或单位', max: PERSON_LIMITS.affiliation }),
    bio: readLocalizedText(issues, body.bio, 'bio', { label: '简介', max: PERSON_LIMITS.bio, multiline: true }),
    photoKey: readOptionalMediaKey(issues, body.photoKey, 'photoKey', 'image', '照片'),
    email: readOptionalEmail(issues, body.email, 'email', '邮箱'),
    linkUrl: readOptionalUrl(issues, body.linkUrl, 'linkUrl', { label: '个人链接' }),
    sortOrder: readInteger(issues, body.sortOrder, 'sortOrder', { label: '排序', min: 0, max: 9999, fallback: 0 }),
    visible: readBoolean(issues, body.visible, 'visible', '是否显示', true),
  };
  // Our People shows English only, so the English name is the one that must be there.
  // "我们的团队" 只显示英文，因此必须填写的是英文姓名。
  if (!value.name.en) issues.add('name.en', '请填写英文姓名');
  return issues.result(value);
}

const SECTION_ORDER: readonly PeopleSection[] = PEOPLE_SECTIONS;
const POSITION_ORDER: readonly PersonPosition[] = [...PRESIDIUM_POSITIONS, 'head', 'vice_head', 'advisor'];
const DEPARTMENT_ORDER: readonly Department[] = DEPARTMENTS;

/**
 * Constitution order: Presidium by office, then departments in Article 4.2 order with the Head before Vice Heads,
 * then advisors. Ties fall to the editor's sort order, then the English or Chinese name.
 * 按章程顺序：主席团按职位排列，然后各部门按第 4.2 条的顺序、部长在副部长之前，最后是荣誉顾问。
 * 顺序相同时按编辑设置的排序值，再按英文或中文姓名排列。
 */
export function comparePeople(a: Person, b: Person): number {
  const bySection = SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section);
  if (bySection !== 0) return bySection;
  const byDepartment = (a.department ? DEPARTMENT_ORDER.indexOf(a.department) : -1) - (b.department ? DEPARTMENT_ORDER.indexOf(b.department) : -1);
  if (byDepartment !== 0) return byDepartment;
  const byPosition = POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position);
  if (byPosition !== 0) return byPosition;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  const nameA = a.name.en || a.name.zh;
  const nameB = b.name.en || b.name.zh;
  return nameA.localeCompare(nameB);
}

/** The custom title when either language has one, otherwise the office title. */
/** 任一语言填写了自定义头衔时使用自定义头衔，否则使用职位名称。 */
export function personDisplayTitle(person: Pick<Person, 'title' | 'position' | 'department'>): LocalizedText {
  return hasText(person.title) ? person.title : defaultPositionTitle(person.position, person.department);
}

/**
 * The monogram shown in place of a missing photo: the first character of a Chinese name, otherwise the initials of
 * the first two words, such as "SZ" for "San Zhang". A nickname in brackets and punctuation in front of a word are left
 * out first, so "Yuan (Andrew) Lai" gives "YL". An empty name gives an empty string.
 * 没有照片时显示的姓名首字：中文姓名取第一个字，其他姓名取前两个词的首字母，例如 "San Zhang" 为 "SZ"。括号中的昵称和词前的标点先被去掉，
 * 因此 "Yuan (Andrew) Lai" 为 "YL"。姓名为空时返回空字符串。
 */
export function personInitials(name: string): string {
  const trimmed = (name.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').trim() || name)
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+/u, ''))
    .filter(Boolean)
    .join(' ');
  if (!trimmed) return '';
  if (/^[\u3400-\u9fff]/.test(trimmed)) return Array.from(trimmed)[0] ?? '';
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => (Array.from(word)[0] ?? '').toUpperCase())
    .join('');
}
