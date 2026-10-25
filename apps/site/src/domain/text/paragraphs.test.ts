import { describe, expect, it } from 'vitest';
import { splitLinks, toParagraphs } from './paragraphs';

describe('toParagraphs', () => {
  it('splits paragraphs on blank lines and lines on newlines', () => {
    expect(toParagraphs('第一段\n第二行\n\n第二段')).toEqual([
      [[{ kind: 'text', text: '第一段' }], [{ kind: 'text', text: '第二行' }]],
      [[{ kind: 'text', text: '第二段' }]],
    ]);
  });

  it('ignores surrounding blank lines', () => {
    expect(toParagraphs('\n\n  hello  \n\n\n')).toHaveLength(1);
  });
});

describe('splitLinks', () => {
  it('links web addresses and leaves sentence punctuation outside', () => {
    expect(splitLinks('报名：https://forms.gle/abc. 谢谢')).toEqual([
      { kind: 'text', text: '报名：' },
      { kind: 'link', text: 'https://forms.gle/abc', href: 'https://forms.gle/abc' },
      { kind: 'text', text: '. 谢谢' },
    ]);
  });

  it('stops at Chinese punctuation', () => {
    expect(splitLinks('见https://utmmsc.com/events，欢迎')[1]).toEqual({ kind: 'link', text: 'https://utmmsc.com/events', href: 'https://utmmsc.com/events' });
  });

  it('never links other schemes', () => {
    expect(splitLinks('javascript:alert(1)')).toEqual([{ kind: 'text', text: 'javascript:alert(1)' }]);
  });
});
