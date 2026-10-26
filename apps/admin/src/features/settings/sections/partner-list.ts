import type { Partner, PartnerKind } from '@msc-web/content';

/**
 * Edits to the sponsors, partners and partner clubs list. Each one finds its entry by id rather than by position,
 * so a logo upload that finishes after an entry was moved or another was removed still changes the right entry,
 * and one whose entry was removed meanwhile changes nothing.
 * 赞助商、合作商与联动社团名单的编辑操作。每个操作按编号而不是位置找到条目，因此在条目被移动或其他条目被删除之后才完成的 Logo 上传，
 * 仍会修改正确的条目；若其条目在此期间已被删除，则不做任何修改。
 */
export type PartnerListChange = (items: Partner[]) => Partner[];

export function addPartner(id: string, kind: PartnerKind = 'sponsor'): PartnerListChange {
  return (items) => [...items, { id, kind, name: { zh: '', en: '' }, logoKey: null, url: '' }];
}

export function updatePartner(id: string, part: Partial<Omit<Partner, 'id'>>): PartnerListChange {
  return (items) => items.map((item) => (item.id === id ? { ...item, ...part } : item));
}

export function removePartner(id: string): PartnerListChange {
  return (items) => items.filter((item) => item.id !== id);
}

/** Moves an entry one place up (-1) or down (+1); at either end it stays where it is. */
/** 将条目上移（-1）或下移（+1）一位；已在两端时保持不动。 */
export function movePartner(id: string, step: -1 | 1): PartnerListChange {
  return (items) => {
    const from = items.findIndex((item) => item.id === id);
    const to = from + step;
    if (from < 0 || to < 0 || to >= items.length) return items;
    const moved = [...items];
    [moved[from], moved[to]] = [moved[to] as Partner, moved[from] as Partner];
    return moved;
  };
}
