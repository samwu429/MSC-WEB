import { DOCUMENT_CATEGORIES, type DocumentCategory, type SiteDocument } from '@msc-web/content';

export interface DocumentGroup {
  category: DocumentCategory;
  documents: SiteDocument[];
}

/** Public records grouped by category in DOCUMENT_CATEGORIES order, keeping the input order within each group and leaving out empty groups. */
/** 按 DOCUMENT_CATEGORIES 的顺序按类别分组的公开记录；组内保持输入顺序，省略空的分组。 */
export function groupDocuments(documents: readonly SiteDocument[]): DocumentGroup[] {
  return DOCUMENT_CATEGORIES.map((category) => ({ category, documents: documents.filter((document) => document.category === category) })).filter(
    (group) => group.documents.length > 0,
  );
}
