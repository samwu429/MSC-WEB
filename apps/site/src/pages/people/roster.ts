import { DEPARTMENTS, PRESIDIUM_POSITIONS, type Department, type Person, type PresidiumPosition } from '@msc-web/content';

/**
 * People arranged into the offices of Article 4. Every office appears even when nobody holds it, so the page can
 * show it as vacant. A position decides the slot, and the input order (constitution order) is kept within each slot.
 * 按章程第四条的职位排列的成员。每个职位都会出现，即使无人担任，页面因此可以显示为空缺。职位决定所在位置，
 * 每个位置内保持输入顺序（即章程顺序）。
 */
export interface PeopleRoster {
  presidium: { position: PresidiumPosition; holders: Person[] }[];
  departments: { department: Department; heads: Person[]; viceHeads: Person[] }[];
  advisors: Person[];
}

export function buildRoster(people: readonly Person[]): PeopleRoster {
  return {
    presidium: PRESIDIUM_POSITIONS.map((position) => ({ position, holders: people.filter((person) => person.position === position) })),
    departments: DEPARTMENTS.map((department) => ({
      department,
      heads: people.filter((person) => person.position === 'head' && person.department === department),
      viceHeads: people.filter((person) => person.position === 'vice_head' && person.department === department),
    })),
    advisors: people.filter((person) => person.position === 'advisor'),
  };
}
