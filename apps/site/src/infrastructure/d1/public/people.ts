import { comparePeople, type PeopleSection, type Person } from '@msc-web/content';
import { toPerson, type PersonRow } from '../rows/people';

/**
 * Visible people for the public pages, in constitution order. Hidden entries never leave the database, so a page
 * cannot show them by mistake.
 * 公开页面显示的成员，按章程顺序排列。隐藏的条目不会被读出数据库，页面因此不可能误显示它们。
 */
export async function listVisiblePeople(db: D1Database, section?: PeopleSection): Promise<Person[]> {
  const statement = section
    ? db.prepare('SELECT * FROM people WHERE visible = 1 AND section = ?').bind(section)
    : db.prepare('SELECT * FROM people WHERE visible = 1');
  const { results } = await statement.all<PersonRow>();
  return results.map(toPerson).sort(comparePeople);
}

/** One visible person for their own page; a hidden or unknown id finds nobody. */
/** 个人页面上的一位正在显示的成员；隐藏或不存在的编号找不到任何人。 */
export async function findVisiblePerson(db: D1Database, id: string): Promise<Person | null> {
  const row = await db.prepare('SELECT * FROM people WHERE id = ? AND visible = 1').bind(id).first<PersonRow>();
  return row ? toPerson(row) : null;
}
