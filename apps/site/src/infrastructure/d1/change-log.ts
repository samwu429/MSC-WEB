import type { AdminIdentity, ChangeLogEntry } from '@msc-web/content';
import { newId, nowIso } from './records';

export interface ChangeInput {
  action: ChangeLogEntry['action'];
  entity: ChangeLogEntry['entity'];
  entityId: string;
  summary: string;
}

const MAX_SUMMARY = 120;

/**
 * The statement that records one change. Repositories put it in the same batch directly after the write it
 * describes, and it inserts only when that write changed a row (changes() refers to the previous statement), so a
 * stale update or a delete that lost a race leaves no false entry and the log never disagrees with the content.
 * 记录一次修改的语句。仓储把它放在同一批次中、紧跟在所描述的写入之后；只有当该写入确实修改了某一行时才会插入
 * （changes() 指的是上一条语句），因此过期的更新或竞争失败的删除不会留下错误的记录，日志与内容永远一致。
 */
export function changeStatement(db: D1Database, identity: AdminIdentity, change: ChangeInput): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO change_log (id, at, member_id, member_name, action, entity, entity_id, summary)
       SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() > 0`,
    )
    .bind(newId('chg'), nowIso(), identity.memberId, identity.displayName, change.action, change.entity, change.entityId, Array.from(change.summary).slice(0, MAX_SUMMARY).join(''));
}

interface ChangeRow {
  id: string;
  at: string;
  member_id: string;
  member_name: string;
  action: string;
  entity: string;
  entity_id: string;
  summary: string;
}

export async function listRecentChanges(db: D1Database, limit = 20): Promise<ChangeLogEntry[]> {
  const result = await db.prepare('SELECT * FROM change_log ORDER BY at DESC, id DESC LIMIT ?').bind(limit).all<ChangeRow>();
  return result.results.map((row) => ({
    id: row.id,
    at: row.at,
    memberId: row.member_id,
    memberName: row.member_name,
    action: row.action as ChangeLogEntry['action'],
    entity: row.entity as ChangeLogEntry['entity'],
    entityId: row.entity_id,
    summary: row.summary,
  }));
}
