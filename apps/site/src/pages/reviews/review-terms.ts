import { compareTerms, isTermKey, type ReviewSessionDetail, type TermKey } from '@msc-web/content';

/** The term tabs: every term with published reviews and always the current one, newest first, each once. */
/** 学期标签：所有已发布复习的学期，并始终包含当前学期，按从新到旧排列且不重复。 */
export function termTabs(published: readonly TermKey[], current: TermKey): TermKey[] {
  return [...new Set([...published, current])].sort((a, b) => compareTerms(b, a));
}

/** The requested term when it is a valid term among the tabs, otherwise the current term. */
/** 所请求的学期有效且在标签之中时使用它，否则使用当前学期。 */
export function selectTerm(requested: string | undefined, tabs: readonly TermKey[], current: TermKey): TermKey {
  return isTermKey(requested) && tabs.includes(requested) ? requested : current;
}

export interface TermSessions {
  term: TermKey;
  sessions: ReviewSessionDetail[];
}

/** Sessions grouped by term, newest term first, keeping their order within each term. */
/** 按学期分组的场次，最新的学期在前，每个学期内保持原有顺序。 */
export function groupSessionsByTerm(sessions: readonly ReviewSessionDetail[]): TermSessions[] {
  const groups = new Map<TermKey, ReviewSessionDetail[]>();
  for (const session of sessions) {
    const list = groups.get(session.term) ?? [];
    list.push(session);
    groups.set(session.term, list);
  }
  return [...groups.entries()].sort(([a], [b]) => compareTerms(b, a)).map(([term, list]) => ({ term, sessions: list }));
}
