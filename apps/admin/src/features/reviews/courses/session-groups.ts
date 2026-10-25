import type { TermKey } from '@msc-web/content';

export interface TermGroup<T> {
  term: TermKey;
  sessions: T[];
}

/**
 * One group per term. The server returns sessions newest term first, and that order is kept both for the groups
 * and for the sessions inside each group.
 * 每个学期一组。服务器按学期从新到旧返回场次，分组顺序与组内场次顺序都保持不变。
 */
export function groupByTerm<T extends { term: TermKey }>(sessions: readonly T[]): TermGroup<T>[] {
  const groups = new Map<TermKey, T[]>();
  for (const session of sessions) {
    const group = groups.get(session.term);
    if (group) group.push(session);
    else groups.set(session.term, [session]);
  }
  return [...groups].map(([term, members]) => ({ term, sessions: members }));
}
