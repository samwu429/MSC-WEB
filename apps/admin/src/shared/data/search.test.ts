import { describe, expect, it } from 'vitest';
import { matchesSearch } from './search';

describe('matchesSearch', () => {
  const texts = ['桌游之夜（示例）', 'Board Game Night (sample)', '2026-11-board-game-night'];

  it('matches everything while the box is empty or blank', () => {
    expect(matchesSearch('', texts)).toBe(true);
    expect(matchesSearch('   ', texts)).toBe(true);
  });

  it('finds words in either language and in the link name, ignoring case', () => {
    expect(matchesSearch('桌游', texts)).toBe(true);
    expect(matchesSearch('board GAME', texts)).toBe(true);
    expect(matchesSearch('2026-11', texts)).toBe(true);
  });

  it('needs every word to appear', () => {
    expect(matchesSearch('board talk', texts)).toBe(false);
  });

  it('skips missing texts', () => {
    expect(matchesSearch('csc108', ['CSC108H5', null, undefined, ''])).toBe(true);
  });
});
