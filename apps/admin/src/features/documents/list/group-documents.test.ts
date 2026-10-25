import { describe, expect, it } from 'vitest';
import type { DocumentCategory, SiteDocument } from '@msc-web/content';
import { groupDocuments } from './group-documents';

function document(id: string, category: DocumentCategory, overrides: Partial<SiteDocument> = {}): SiteDocument {
  return {
    id,
    category,
    title: { zh: id, en: '' },
    mediaKey: 'doc/2026/0123456789abcdef0123456789abcdef.pdf',
    publishedOn: '2026-09-01',
    visible: true,
    sortOrder: 0,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('groupDocuments', () => {
  it('orders groups by category and leaves out empty categories', () => {
    const groups = groupDocuments([document('minutes', 'meeting_records'), document('rules', 'constitution'), document('misc', 'other')]);
    expect(groups.map((group) => [group.category, group.label])).toEqual([
      ['constitution', '章程'],
      ['meeting_records', '会议记录'],
      ['other', '其他文件'],
    ]);
  });

  it("keeps the server's order within each category instead of sorting again", () => {
    const groups = groupDocuments([
      document('older', 'public_accounts', { publishedOn: '2025-04-30', sortOrder: 1 }),
      document('minutes', 'meeting_records'),
      document('pinned', 'public_accounts', { publishedOn: '2024-04-30', sortOrder: 0 }),
      document('newer', 'public_accounts', { publishedOn: '2026-04-30', sortOrder: 1 }),
    ]);
    expect(groups[0]?.documents.map((item) => item.id)).toEqual(['older', 'pinned', 'newer']);
    expect(groups[1]?.documents.map((item) => item.id)).toEqual(['minutes']);
  });

  it('returns no groups when there are no documents', () => {
    expect(groupDocuments([])).toEqual([]);
  });
});
