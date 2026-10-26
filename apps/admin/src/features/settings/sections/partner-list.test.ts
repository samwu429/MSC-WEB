import { describe, expect, it } from 'vitest';
import type { Partner } from '@msc-web/content';
import { addPartner, movePartner, removePartner, updatePartner } from './partner-list';

const LOGO_KEY = 'img/2026/0123456789abcdef0123456789abcdef.png';

function ids(items: Partner[]): string[] {
  return items.map((item) => item.id);
}

describe('partner list edits', () => {
  const start = [addPartner('a'), addPartner('b', 'club'), addPartner('c', 'partner')].reduce<Partner[]>((items, change) => change(items), []);

  it('adds empty entries of the chosen kind at the end', () => {
    expect(ids(start)).toEqual(['a', 'b', 'c']);
    expect(start[1]).toEqual({ id: 'b', kind: 'club', name: { zh: '', en: '' }, logoKey: null, url: '' });
  });

  it('moves an entry by one place and leaves the ends alone', () => {
    expect(ids(movePartner('b', -1)(start))).toEqual(['b', 'a', 'c']);
    expect(ids(movePartner('b', 1)(start))).toEqual(['a', 'c', 'b']);
    expect(movePartner('a', -1)(start)).toBe(start);
    expect(movePartner('c', 1)(start)).toBe(start);
    expect(movePartner('missing', 1)(start)).toBe(start);
  });

  it('lands a late logo upload on its entry after the list changed, and drops it if the entry is gone', () => {
    const upload = updatePartner('c', { logoKey: LOGO_KEY });
    const reordered = upload(removePartner('a')(movePartner('c', -1)(start)));
    expect(ids(reordered)).toEqual(['c', 'b']);
    expect(reordered.find((item) => item.id === 'c')?.logoKey).toBe(LOGO_KEY);
    expect(reordered.find((item) => item.id === 'b')?.logoKey).toBeNull();

    const removed = upload(removePartner('c')(start));
    expect(removed.every((item) => item.logoKey === null)).toBe(true);
  });
});
