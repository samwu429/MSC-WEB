import type { Department, PeopleSection, Person, PersonPosition } from '@msc-web/content';
import { fromFlag } from '../records';

/** A row of the people table. */
/** people 表的一行。 */
export interface PersonRow {
  id: string;
  section: string;
  position: string;
  department: string | null;
  name_zh: string;
  name_en: string;
  title_zh: string;
  title_en: string;
  affiliation_zh: string;
  affiliation_en: string;
  bio_zh: string;
  bio_en: string;
  photo_key: string | null;
  email: string | null;
  link_url: string | null;
  sort_order: number;
  visible: number;
  created_at: string;
  updated_at: string;
}

export function toPerson(row: PersonRow): Person {
  return {
    id: row.id,
    section: row.section as PeopleSection,
    position: row.position as PersonPosition,
    department: (row.department as Department | null) ?? null,
    name: { zh: row.name_zh, en: row.name_en },
    title: { zh: row.title_zh, en: row.title_en },
    affiliation: { zh: row.affiliation_zh, en: row.affiliation_en },
    bio: { zh: row.bio_zh, en: row.bio_en },
    photoKey: row.photo_key,
    email: row.email,
    linkUrl: row.link_url,
    sortOrder: row.sort_order,
    visible: fromFlag(row.visible),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
