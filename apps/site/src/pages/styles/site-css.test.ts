import { describe, expect, it } from 'vitest';
import { SITE_CSS } from './site-css';

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
});
