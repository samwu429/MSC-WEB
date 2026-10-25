import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, type DocumentCategory, type SiteDocument } from '@msc-web/content';

export interface DocumentGroup {
  category: DocumentCategory;
  label: string;
  documents: SiteDocument[];
}

/**
 * Documents grouped in the fixed category order, leaving out empty categories. The server returns them in the
 * public About page's order, and each group keeps that order.
 * 按固定的类别顺序分组，省略没有文件的类别。服务器按公开关于页面的顺序返回文件，每组都保持这一顺序。
 */
export function groupDocuments(documents: readonly SiteDocument[]): DocumentGroup[] {
  return DOCUMENT_CATEGORIES.flatMap((category) => {
    const members = documents.filter((document) => document.category === category);
    return members.length > 0 ? [{ category, label: DOCUMENT_CATEGORY_LABELS[category].zh, documents: members }] : [];
  });
}
