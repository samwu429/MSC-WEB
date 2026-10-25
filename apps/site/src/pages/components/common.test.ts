import { describe, expect, it } from 'vitest';
import { fallbackLang, txt } from './common';

describe('fallbackLang', () => {
  it('names the other language only when the text fell back to it', () => {
    expect(fallbackLang({ zh: '中秋晚会', en: '' }, 'en')).toBe('zh-CN');
    expect(fallbackLang({ zh: '', en: 'Mid-Autumn Night' }, 'zh')).toBe('en-CA');
    expect(fallbackLang({ zh: '  ', en: 'Mid-Autumn Night' }, 'zh')).toBe('en-CA');
  });

  it('leaves the attribute out when the visitor language has text or neither side has any', () => {
    expect(fallbackLang({ zh: '中秋晚会', en: 'Mid-Autumn Night' }, 'en')).toBeUndefined();
    expect(fallbackLang({ zh: '中秋晚会', en: '' }, 'zh')).toBeUndefined();
    expect(fallbackLang({ zh: '', en: '' }, 'en')).toBeUndefined();
    expect(fallbackLang({ zh: ' ', en: '' }, 'en')).toBeUndefined();
  });

  it('agrees with txt about which side is shown', () => {
    const text = { zh: '中秋晚会', en: ' ' };
    expect(txt(text, 'en')).toBe('中秋晚会');
    expect(fallbackLang(text, 'en')).toBe('zh-CN');
  });
});
