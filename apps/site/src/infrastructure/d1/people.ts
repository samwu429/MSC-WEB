import { comparePeople, pickText, type AdminIdentity, type Department, type Person, type PersonInput, type PersonPosition } from '@msc-web/content';
import { changeStatement } from './change-log';
import { newId, nextVersion, nowIso, toFlag, versionedOutcome } from './records';
import { toPerson, type PersonRow } from './rows/people';

/**
 * The people table behind "Our People". Reads return every person, hidden ones included, because the editing
 * backend lists them all; the public page filters by visibility itself.
 * "我们的团队" 所用的 people 表。读取会返回所有成员（包括隐藏的成员），因为编辑后台需要全部列出；公开页面自行按是否显示筛选。
 */

const TABLE = 'people';

/** Columns a save writes, in the order contentValues lists their values. */
/** 保存时写入的列，顺序与 contentValues 给出的值一致。 */
const CONTENT_COLUMNS = [
  'section',
  'position',
  'department',
  'name_zh',
  'name_en',
  'title_zh',
  'title_en',
  'affiliation_zh',
  'affiliation_en',
  'bio_zh',
  'bio_en',
  'photo_key',
  'email',
  'link_url',
  'sort_order',
  'visible',
] as const;

const INSERT_SQL = `INSERT INTO people (id, ${CONTENT_COLUMNS.join(', ')}, created_at, updated_at)
  VALUES (${Array.from({ length: CONTENT_COLUMNS.length + 3 }, () => '?').join(', ')})`;

const UPDATE_SQL = `UPDATE people SET ${CONTENT_COLUMNS.map((column) => `${column} = ?`).join(', ')}, updated_at = ?
  WHERE id = ? AND updated_at = ? RETURNING *`;

function contentValues(input: PersonInput): (string | number | null)[] {
  return [
    input.section,
    input.position,
    input.department,
    input.name.zh,
    input.name.en,
    input.title.zh,
    input.title.en,
    input.affiliation.zh,
    input.affiliation.en,
    input.bio.zh,
    input.bio.en,
    input.photoKey,
    input.email,
    input.linkUrl,
    input.sortOrder,
    toFlag(input.visible),
  ];
}

function changeSummary(person: Pick<PersonInput, 'name'>): string {
  return pickText(person.name, 'zh');
}

/** Everyone, hidden people included, in constitution order. */
/** 所有成员（包括隐藏的成员），按章程顺序排列。 */
export async function listPeople(db: D1Database): Promise<Person[]> {
  const result = await db.prepare('SELECT * FROM people').all<PersonRow>();
  return result.results.map(toPerson).sort(comparePeople);
}

export async function findPerson(db: D1Database, id: string): Promise<Person | null> {
  const row = await db.prepare('SELECT * FROM people WHERE id = ?').bind(id).first<PersonRow>();
  return row ? toPerson(row) : null;
}

/**
 * The visible person other than `exceptId` who holds an office, the earliest added first. An office is a position
 * together with its department, which is null for the Presidium. Hidden people are never returned.
 * 除 `exceptId` 以外、担任某个职位且正在显示的成员，按添加时间取最早的一位。职位由职位名与所属部门共同确定，主席团的部门为空。
 * 隐藏的成员永远不会被返回。
 */
export async function findVisibleOfficeHolder(
  db: D1Database,
  position: PersonPosition,
  department: Department | null,
  exceptId: string | null,
): Promise<Person | null> {
  const row = await db
    .prepare('SELECT * FROM people WHERE visible = 1 AND position = ? AND department IS ? AND id IS NOT ? ORDER BY created_at, id LIMIT 1')
    .bind(position, department, exceptId)
    .first<PersonRow>();
  return row ? toPerson(row) : null;
}

export async function createPerson(db: D1Database, identity: AdminIdentity, input: PersonInput): Promise<Person> {
  const id = newId('per');
  const now = nowIso();
  await db.batch([
    db.prepare(INSERT_SQL).bind(id, ...contentValues(input), now, now),
    changeStatement(db, identity, { action: 'create', entity: 'person', entityId: id, summary: changeSummary(input) }),
  ]);
  return { id, ...input, createdAt: now, updatedAt: now };
}

export type PersonUpdate = { outcome: 'updated'; person: Person } | { outcome: 'missing' } | { outcome: 'stale' };

/** Saves over the version the editor loaded; any other stored version leaves the row untouched. */
/** 在编辑者加载的版本之上保存；库中为其他版本时不修改该行。 */
export async function updatePerson(
  db: D1Database,
  identity: AdminIdentity,
  id: string,
  input: PersonInput,
  expectedUpdatedAt: string,
): Promise<PersonUpdate> {
  const [update] = await db.batch<PersonRow>([
    db.prepare(UPDATE_SQL).bind(...contentValues(input), nextVersion(expectedUpdatedAt), id, expectedUpdatedAt),
    changeStatement(db, identity, { action: 'update', entity: 'person', entityId: id, summary: changeSummary(input) }),
  ]);
  const row = update?.results[0];
  if (row) return { outcome: 'updated', person: toPerson(row) };
  return (await versionedOutcome(db, TABLE, id, 0)) === 'missing' ? { outcome: 'missing' } : { outcome: 'stale' };
}

/** Deletes a person and returns the record as it was, so the caller can release its photo; null when there was none. */
/** 删除一位成员并返回删除前的记录，供调用方释放其照片；不存在时返回 null。 */
export async function deletePerson(db: D1Database, identity: AdminIdentity, id: string): Promise<Person | null> {
  const person = await findPerson(db, id);
  if (!person) return null;
  await db.batch([
    db.prepare('DELETE FROM people WHERE id = ?').bind(id),
    changeStatement(db, identity, { action: 'delete', entity: 'person', entityId: id, summary: changeSummary(person) }),
  ]);
  return person;
}
