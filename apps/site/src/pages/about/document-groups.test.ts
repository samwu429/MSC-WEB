import { describe, expect, it } from 'vitest';
import type { DocumentCategory, SiteDocument } from '@msc-web/content';
import { groupDocuments } from './document-groups';

const AT = '2026-09-01T00:00:00.000Z';

function document(id: string, category: DocumentCategory): SiteDocument {
  return {
    id,
    category,
    title: { zh: id, en: id },
    mediaKey: 'doc/2026/0123456789abcdef0123456789abcdef.pdf',
    publishedOn: '2026-09-01',
    visible: true,
    sortOrder: 0,
    createdAt: AT,
    updatedAt: AT,
  };
}

describe('groupDocuments', () => {
  it('orders groups by category, keeps the given order inside each, and leaves out empty categories', () => {
    const groups = groupDocuments([
      document('minutes-new', 'meeting_records'),
      document('constitution', 'constitution'),
      document('minutes-old', 'meeting_records'),
      document('accounts', 'public_accounts'),
    ]);
    expect(groups.map((group) => [group.category, group.documents.map((entry) => entry.id)])).toEqual([
      ['constitution', ['constitution']],
      ['public_accounts', ['accounts']],
      ['meeting_records', ['minutes-new', 'minutes-old']],
    ]);
  });

  it('returns no groups for no documents', () => {
    expect(groupDocuments([])).toEqual([]);
  });
});
