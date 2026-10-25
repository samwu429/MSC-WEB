import { describe, expect, it } from 'vitest';
import type { ReviewMaterial } from '@msc-web/content';
import { issueMap } from '../../../shared/forms/issues';
import { issuesForSource, materialDraftOf, materialInputOf, materialListLabel, nextSortOrder, placeMaterial } from './material-draft';

const DOC_KEY = 'doc/2026/0123456789abcdef0123456789abcdef.pdf';

function material(overrides: Partial<ReviewMaterial>): ReviewMaterial {
  return {
    id: 'mat_1',
    sessionId: 'rvs_1',
    kind: 'slides',
    label: { zh: '', en: '' },
    mediaKey: DOC_KEY,
    url: null,
    sortOrder: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('nextSortOrder', () => {
  it('places a new material after the last one and stays within the allowed range', () => {
    expect(nextSortOrder([])).toBe(0);
    expect(nextSortOrder([{ sortOrder: 3 }, { sortOrder: 7 }, { sortOrder: 1 }])).toBe(8);
    expect(nextSortOrder([{ sortOrder: 9999 }])).toBe(9999);
  });
});

describe('materialDraftOf', () => {
  it('opens a saved link on the link source and a saved file on the upload source', () => {
    expect(materialDraftOf(material({ mediaKey: null, url: 'https://example.com/folder' }), []).source).toBe('link');
    expect(materialDraftOf(material({}), []).source).toBe('upload');
  });

  it('starts a new material as an upload at the end of the existing list', () => {
    const draft = materialDraftOf(null, [material({ sortOrder: 4 })]);
    expect(draft).toMatchObject({ source: 'upload', mediaKey: null, url: '', sortOrder: 5 });
  });
});

describe('materialInputOf', () => {
  it('sends only the file when the upload source is chosen', () => {
    const input = materialInputOf({ ...materialDraftOf(null, []), mediaKey: DOC_KEY, url: 'https://example.com/old' });
    expect(input.mediaKey).toBe(DOC_KEY);
    expect(input.url).toBeNull();
  });

  it('sends only the trimmed link when the link source is chosen', () => {
    const input = materialInputOf({ ...materialDraftOf(null, []), source: 'link', mediaKey: DOC_KEY, url: '  https://example.com/folder ' });
    expect(input.mediaKey).toBeNull();
    expect(input.url).toBe('https://example.com/folder');
  });

  it('sends a blank link as none so the server reports it as missing', () => {
    expect(materialInputOf({ ...materialDraftOf(null, []), source: 'link', url: '  ' }).url).toBeNull();
  });
});

describe('issuesForSource', () => {
  const missing = issueMap([{ field: 'mediaKey', message: '请上传 PDF 文件或填写资料链接' }]);

  it('shows a missing-source issue under the link field when the link source is chosen', () => {
    expect(issuesForSource(missing, 'link').get('url')).toBe('请上传 PDF 文件或填写资料链接');
  });

  it('leaves issues alone when they already belong to the visible field', () => {
    expect(issuesForSource(missing, 'upload')).toBe(missing);
    const both = issueMap([
      { field: 'url', message: '资料链接必须是以 https:// 或 http:// 开头的完整网址' },
      { field: 'mediaKey', message: '请上传 PDF 文件或填写资料链接' },
    ]);
    expect(issuesForSource(both, 'link').get('url')).toBe('资料链接必须是以 https:// 或 http:// 开头的完整网址');
  });
});

describe('materialListLabel', () => {
  it('shows an English-only label instead of the kind name', () => {
    expect(materialListLabel(material({ kind: 'practice', label: { zh: '', en: '2023 Practice Midterm' } }))).toBe('2023 Practice Midterm');
  });

  it('prefers the Chinese label and falls back to the kind name when both are empty', () => {
    expect(materialListLabel(material({ label: { zh: '第 1-5 周课件', en: 'Week 1-5 slides' } }))).toBe('第 1-5 周课件');
    expect(materialListLabel(material({ kind: 'slides' }))).toBe('课件');
  });
});

describe('placeMaterial', () => {
  it('replaces the previous version and orders by sort order, then creation time', () => {
    const first = material({ id: 'a', sortOrder: 1, createdAt: '2026-10-01T00:00:00.000Z' });
    const second = material({ id: 'b', sortOrder: 1, createdAt: '2026-10-02T00:00:00.000Z' });
    const third = material({ id: 'c', sortOrder: 2 });
    const moved = { ...third, sortOrder: 0 };
    expect(placeMaterial([first, second, third], moved).map((item) => item.id)).toEqual(['c', 'a', 'b']);
    expect(placeMaterial([second, third], first).map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });
});
