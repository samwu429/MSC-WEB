import type { DocumentCategory, SiteDocument } from '@msc-web/content';
import { fromFlag } from '../records';

/** A row of the documents table. */
/** documents 表的一行。 */
export interface DocumentRow {
  id: string;
  category: string;
  title_zh: string;
  title_en: string;
  media_key: string;
  published_on: string;
  visible: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function toSiteDocument(row: DocumentRow): SiteDocument {
  return {
    id: row.id,
    category: row.category as DocumentCategory,
    title: { zh: row.title_zh, en: row.title_en },
    mediaKey: row.media_key,
    publishedOn: row.published_on,
    visible: fromFlag(row.visible),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
