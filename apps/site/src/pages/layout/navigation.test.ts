import { describe, expect, it } from 'vitest';
import { navItems, type NavItem } from './navigation';

function item(path: string, href: string): NavItem {
  const found = navItems(path).find((candidate) => candidate.href === href);
  if (!found) throw new Error(`no navigation item for ${href}`);
  return found;
}

/** Each dropdown page's link with its mark, in order. */
/** 下拉菜单中每个页面的链接及其标记，按顺序排列。 */
function marks(path: string, href: string): [string, string | undefined][] {
  return item(path, href).children.map((child) => [child.href, child.current]);
}

describe('navItems', () => {
  it('lists the sections in order, with Academic Activities where Test Reviews used to be', () => {
    expect(navItems('/').map((section) => section.href)).toEqual(['/', '/events', '/academics', '/people', '/about']);
  });

  it('gives Academic Activities a dropdown of Test Reviews, then Interest Classes, labelled in both languages', () => {
    const academics = item('/', '/academics');
    expect(academics.label).toEqual({ zh: '学术活动', en: 'Academic Activities' });
    expect(academics.children.map((child) => [child.href, child.label])).toEqual([
      ['/reviews', { zh: '考前复习', en: 'Test Reviews' }],
      ['/interest-classes', { zh: '兴趣课', en: 'Interest Classes' }],
    ]);
  });

  it('keeps Our People and its groups in English only', () => {
    const people = item('/', '/people');
    expect(people.label).toBe('Our People');
    expect(people.children.map((child) => child.label)).toEqual(['Presidium', 'Department Leads', 'Honorary Advisors']);
  });

  it('marks Academic Activities as the page on /academics, with no dropdown page marked', () => {
    expect(item('/academics', '/academics').current).toBe('page');
    expect(marks('/academics', '/academics')).toEqual([
      ['/reviews', undefined],
      ['/interest-classes', undefined],
    ]);
  });

  it('marks the open dropdown page as the page and Academic Activities as containing it', () => {
    expect(item('/reviews', '/academics').current).toBe('true');
    expect(marks('/reviews', '/academics')).toEqual([
      ['/reviews', 'page'],
      ['/interest-classes', undefined],
    ]);
    expect(item('/interest-classes', '/academics').current).toBe('true');
    expect(marks('/interest-classes', '/academics')).toEqual([
      ['/reviews', undefined],
      ['/interest-classes', 'page'],
    ]);
  });

  it('marks Test Reviews as containing a course page, and an interest class as sitting under Interest Classes', () => {
    expect(item('/reviews/csc108h5', '/academics').current).toBe('true');
    expect(marks('/reviews/csc108h5', '/academics')).toEqual([
      ['/reviews', 'true'],
      ['/interest-classes', undefined],
    ]);
    expect(item('/interest-classes/2026-11-why-prices-rise', '/academics').current).toBe('true');
    expect(marks('/interest-classes/2026-11-why-prices-rise', '/academics')).toEqual([
      ['/reviews', undefined],
      ['/interest-classes', 'true'],
    ]);
    expect(item('/interest-classes/2026-11-why-prices-rise', '/events').current).toBeUndefined();
  });

  it('leaves Academic Activities unmarked elsewhere', () => {
    for (const path of ['/', '/events', '/events/2026-11-board-game-night', '/people/presidium', '/about']) {
      expect(item(path, '/academics').current, path).toBeUndefined();
      expect(marks(path, '/academics').every(([, current]) => current === undefined), path).toBe(true);
    }
  });
});
