import {
  DEPARTMENTS,
  PRESIDIUM_POSITIONS,
  comparePeople,
  personDisplayTitle,
  personInitials,
  pickText,
  type Department,
  type LocalizedText,
  type Person,
  type PresidiumPosition,
} from '@msc-web/content';

/**
 * The people list laid out like the constitution: every Presidium office, every department with its Head and Vice
 * Heads, then advisors. Empty offices keep their slot, so an editor can see what is vacant and fill it.
 * 按章程排列的成员列表：每个主席团职位、每个部门及其部长与副部长，最后是荣誉顾问。空缺的职位也保留位置，编辑者因此能看到哪些职位空缺并补上。
 */
export interface PeopleBoard {
  presidium: { position: PresidiumPosition; people: Person[] }[];
  departments: { department: Department; heads: Person[]; viceHeads: Person[] }[];
  advisors: Person[];
}

export function buildPeopleBoard(people: readonly Person[]): PeopleBoard {
  const sorted = [...people].sort(comparePeople);
  return {
    presidium: PRESIDIUM_POSITIONS.map((position) => ({
      position,
      people: sorted.filter((person) => person.section === 'presidium' && person.position === position),
    })),
    departments: DEPARTMENTS.map((department) => {
      const members = sorted.filter((person) => person.section === 'department' && person.department === department);
      return {
        department,
        heads: members.filter((person) => person.position === 'head'),
        viceHeads: members.filter((person) => person.position === 'vice_head'),
      };
    }),
    advisors: sorted.filter((person) => person.section === 'advisor'),
  };
}

/** The title the Chinese site shows. */
/** 中文网站显示的头衔。 */
export function personTitle(person: Person): string {
  return pickText(personDisplayTitle(person), 'zh');
}

/** The placeholder for a missing photo, the same initials the Chinese site shows, or "?" for an empty name. */
/** 没有照片时的占位文字，与中文网站显示的首字相同；姓名为空时为 "?"。 */
export function photoPlaceholder(name: LocalizedText): string {
  return personInitials(pickText(name, 'zh')) || '?';
}
