import { describe, expect, it } from 'vitest';
import { IssueCollector } from './issues';
import { characterCount, cleanText, isSafeHttpUrl, readLocalizedText, readOptionalUrl, readText } from './fields';

describe('cleanText', () => {
  it('trims, unifies line endings and drops control characters', () => {
    expect(cleanText('  a\r\nb\u0000c\u0007  ')).toBe('a\nbc');
  });
});

describe('characterCount', () => {
  it('counts an emoji once', () => {
    expect(characterCount('学术😀')).toBe(3);
  });
});

describe('readText', () => {
  it('requires a value when asked', () => {
    const issues = new IssueCollector();
    expect(readText(issues, '   ', 'title', { label: '标题', max: 10, required: true })).toBe('');
    expect(issues.issues).toEqual([{ field: 'title', message: '请填写标题' }]);
  });

  it('folds newlines in single-line fields and limits length', () => {
    const issues = new IssueCollector();
    expect(readText(issues, 'a\n b', 'name', { label: '姓名', max: 2 })).toBe('a b');
    expect(issues.issues[0]?.field).toBe('name');
  });

  it('refuses non-strings', () => {
    const issues = new IssueCollector();
    readText(issues, 5, 'name', { label: '姓名', max: 10 });
    expect(issues.empty).toBe(false);
  });
});

describe('readLocalizedText', () => {
  it('accepts one language when required', () => {
    const issues = new IssueCollector();
    expect(readLocalizedText(issues, { zh: '', en: 'Hello' }, 'title', { label: '标题', max: 10, required: true })).toEqual({ zh: '', en: 'Hello' });
    expect(issues.empty).toBe(true);
  });

  it('reports a missing title against the Chinese side', () => {
    const issues = new IssueCollector();
    readLocalizedText(issues, {}, 'title', { label: '标题', max: 10, required: true });
    expect(issues.issues).toEqual([{ field: 'title.zh', message: '请至少用一种语言填写标题' }]);
  });
});

describe('URLs', () => {
  it('accepts http and https only, without credentials', () => {
    expect(isSafeHttpUrl('https://utmmsc.com/events')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('https://user:pass@example.com')).toBe(false);
    expect(isSafeHttpUrl('mailto:a@b.com')).toBe(false);
  });

  it('accepts a site path only when allowed, never a protocol-relative one', () => {
    const issues = new IssueCollector();
    expect(readOptionalUrl(issues, '/UTMMSC/', 'url', { label: '链接', allowSitePath: true })).toBe('/UTMMSC/');
    expect(readOptionalUrl(issues, '//evil.example', 'url', { label: '链接', allowSitePath: true })).toBeNull();
    expect(readOptionalUrl(issues, '/UTMMSC/', 'url2', { label: '链接' })).toBeNull();
    expect(issues.issues.map((issue) => issue.field)).toEqual(['url', 'url2']);
  });

  it('keeps site paths with a query', () => {
    const issues = new IssueCollector();
    expect(readOptionalUrl(issues, '/events?type=academic', 'url', { label: '链接', allowSitePath: true })).toBe('/events?type=academic');
    expect(issues.empty).toBe(true);
  });

  it('refuses site paths a browser would resolve to another host', () => {
    for (const text of ['/\t/evil.example', '/\n/evil.example', '/\\evil.example', '/\\/evil.example', '//evil.example:99999']) {
      const issues = new IssueCollector();
      expect(readOptionalUrl(issues, text, 'url', { label: '链接', allowSitePath: true })).toBeNull();
      expect(issues.issues.map((issue) => issue.field)).toEqual(['url']);
    }
  });

  it('treats an empty value as none', () => {
    const issues = new IssueCollector();
    expect(readOptionalUrl(issues, '', 'url', { label: '链接' })).toBeNull();
    expect(issues.empty).toBe(true);
  });
});
