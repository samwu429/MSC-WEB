import {
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  DEPARTMENT_POSITIONS,
  DEPARTMENT_POSITION_LABELS,
  PEOPLE_SECTIONS,
  PRESIDIUM_POSITIONS,
  PRESIDIUM_POSITION_LABELS,
  emptyText,
  type Department,
  type PeopleSection,
  type Person,
  type PersonInput,
  type PersonPosition,
} from '@msc-web/content';

/**
 * Form state for one person. Section, position and department must always agree, because the server refuses a
 * Presidium office with a department or a department role without one; every change goes through
 * placementFor so the form can never hold a combination the validator rejects.
 * 单个成员的表单状态。分组、职位与部门必须始终一致，因为服务器会拒绝带部门的主席团职位或不带部门的部门职位；
 * 每次修改都经过 placementFor，表单因此永远不会出现校验器拒绝的组合。
 */

export type Placement = Pick<PersonInput, 'section' | 'position' | 'department'>;

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export const SECTION_OPTIONS: readonly SelectOption<PeopleSection>[] = [
  { value: 'presidium', label: '主席团' },
  { value: 'department', label: '部门' },
  { value: 'advisor', label: '荣誉顾问' },
];

export const DEPARTMENT_OPTIONS: readonly SelectOption<Department>[] = DEPARTMENTS.map((department) => ({
  value: department,
  label: DEPARTMENT_LABELS[department].zh,
}));

/** Offices to choose from in a section; advisors have none. */
/** 某个分组可选择的职位；荣誉顾问没有可选职位。 */
export function positionOptions(section: PeopleSection): SelectOption<PersonPosition>[] {
  if (section === 'presidium') return PRESIDIUM_POSITIONS.map((position) => ({ value: position, label: PRESIDIUM_POSITION_LABELS[position].zh }));
  if (section === 'department') return DEPARTMENT_POSITIONS.map((position) => ({ value: position, label: DEPARTMENT_POSITION_LABELS[position].zh }));
  return [];
}

function isOneOf<T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/** A valid placement for a section, keeping the given position and department where they still fit. */
/** 某个分组的有效职位组合；原有职位与部门仍然适用时予以保留。 */
export function placementFor(section: PeopleSection, position: unknown, department: unknown): Placement {
  if (section === 'presidium') {
    return { section, position: isOneOf(PRESIDIUM_POSITIONS, position) ? position : 'president', department: null };
  }
  if (section === 'department') {
    return {
      section,
      position: isOneOf(DEPARTMENT_POSITIONS, position) ? position : 'head',
      department: isOneOf(DEPARTMENTS, department) ? department : DEPARTMENTS[0],
    };
  }
  return { section, position: 'advisor', department: null };
}

export function withSection(value: PersonInput, section: PeopleSection): PersonInput {
  return { ...value, ...placementFor(section, value.position, value.department) };
}

export function emptyPersonInput(placement: Placement): PersonInput {
  return {
    ...placement,
    name: emptyText(),
    title: emptyText(),
    affiliation: emptyText(),
    bio: emptyText(),
    photoKey: null,
    email: null,
    linkUrl: null,
    sortOrder: 0,
    visible: true,
  };
}

/** The address of a new entry pre-set to one office, as the people list links to it. */
/** 预设为某个职位的新成员地址，供成员列表链接使用。 */
export function newPersonPath(placement: Placement): string {
  const params = new URLSearchParams({ section: placement.section });
  if (placement.section !== 'advisor') params.set('position', placement.position);
  if (placement.department) params.set('department', placement.department);
  return `/people/new?${params.toString()}`;
}

/** The starting values of a new entry from its address. Unknown or mismatched values fall back to valid ones. */
/** 根据地址得到新成员的初始值。未知或不匹配的值会回落为有效值。 */
export function personDefaultsFromQuery(params: URLSearchParams): PersonInput {
  const section = params.get('section');
  const placement = placementFor(isOneOf(PEOPLE_SECTIONS, section) ? section : 'presidium', params.get('position'), params.get('department'));
  return emptyPersonInput(placement);
}

/** The editable fields of a stored person, exactly the shape the save request carries. */
/** 已保存成员的可编辑字段，与保存请求携带的结构完全一致。 */
export function toPersonInput(person: Person): PersonInput {
  return {
    section: person.section,
    position: person.position,
    department: person.department,
    name: person.name,
    title: person.title,
    affiliation: person.affiliation,
    bio: person.bio,
    photoKey: person.photoKey,
    email: person.email,
    linkUrl: person.linkUrl,
    sortOrder: person.sortOrder,
    visible: person.visible,
  };
}
