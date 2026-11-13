import { describe, expect, it } from 'vitest';
import { SITE_CSS } from './site-css';

/** Every rule of the stylesheet, including those inside media queries, as its selector and declarations. */
/** 样式表中的每条规则（包括媒体查询中的规则），以选择器与声明表示。 */
function rules(): { selector: string; body: string }[] {
  return [...SITE_CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector = '', body = '']) => ({ selector: selector.trim(), body: body.trim() }));
}

describe('site stylesheet', () => {
  it('keeps anchor targets clear of the sticky header', () => {
    const header = /\.site-header__inner \{[^}]*min-height: (\d+)px/.exec(SITE_CSS);
    const padding = /html \{[^}]*scroll-padding-top: (\d+)px/.exec(SITE_CSS);
    expect(header).not.toBeNull();
    expect(padding).not.toBeNull();
    expect(Number(padding?.[1])).toBeGreaterThan(Number(header?.[1]));
  });

  it('styles the footer column titles at the h2 level the footer uses', () => {
    expect(SITE_CSS).toContain('.footer-col h2 {');
    expect(SITE_CSS).not.toContain('.footer-col h3');
  });

  it("keeps the monogram a person's own page draws for a missing photo, and scopes the tiles' monogram rules under the tile", () => {
    const monogram = rules().filter((rule) => rule.selector.includes('.person__monogram'));
    // The profile page's .profile__photo.person__monogram: large centred initials, and smaller on phones.
    // 个人页面的 .profile__photo.person__monogram：居中的大号姓名首字，手机上略小。
    expect(monogram.filter((rule) => rule.selector === '.person__monogram').map((rule) => rule.body)).toEqual([
      'display: grid; place-items: center; width: 100%; aspect-ratio: 4 / 5; background: var(--purple-100); color: var(--purple-700); font-size: 3.2rem; font-weight: 800; letter-spacing: 0.04em;',
      'font-size: 2.4rem;',
    ]);
    const tile = monogram.filter((rule) => rule.selector !== '.person__monogram');
    expect(tile.length).toBeGreaterThan(0);
    for (const rule of tile) expect(rule.selector).toMatch(/^\.person[ :]/);
    expect(SITE_CSS).toMatch(/\n\.profile__photo \{[^}]*aspect-ratio: 4 \/ 5;[^}]*border-bottom: 4px solid var\(--purple-700\);/);
  });

  it('draws everyone in Our People as one tile, with a gold ring around the whole tile on keyboard focus', () => {
    expect(SITE_CSS).toContain('.person__link:focus-visible::after { outline: 3px solid var(--gold-500);');
    expect(SITE_CSS).toContain('.people-grid--advisors .person__title { color: var(--muted); font-weight: 400;');
    // An advisor's credential and affiliation share a colour and size, so a wider gap keeps them from reading as one paragraph.
    // 顾问的头衔与单位颜色、字号相同，因此用更大的间距避免两者读成一段话。
    expect(SITE_CSS).toContain('.people-grid--advisors .person__affiliation { margin-top: 6px; }');
    for (const gone of ['.portraits', '.person--', '.offices', '.departments', '.department', '.person__duties']) {
      expect(SITE_CSS, gone).not.toContain(gone);
    }
  });

  it('keeps four tiles on one tablet line and breaks the group sizes that would end with one tile alone into even rows', () => {
    // Below 753px the tiles shrink a little so that four still fit, instead of wrapping four as 2+2.
    // 窄于 753px 时方块略微缩小，四个仍能排在一行，而不是排成 2+2。
    expect(SITE_CSS).toContain('.people-grid { --tile: min(160px, calc((100vw - 65px - 3 * var(--gap)) / 4)); }');
    expect(SITE_CSS).not.toContain('.people-grid:has(> :nth-child(4)):not(:has(> :nth-child(5)))');
    // 5 and 9 where four fit on a line, 6, 11, 12 and 16 where five fit, and 13 where six fit.
    // 每行放得下四个时的 5 与 9，放得下五个时的 6、11、12 与 16，以及放得下六个时的 13。
    const counts = [
      [5, 6],
      [6, 7],
      [9, 10],
      [11, 13],
      [13, 14],
      [16, 17],
    ] as const;
    for (const [count, next] of counts) {
      expect(SITE_CSS, `${count}`).toContain(`.people-grid:has(> :nth-child(${count})):not(:has(> :nth-child(${next})))`);
    }
  });
});
