import type { SiteDocument } from '@msc-web/content';
import { toSiteDocument, type DocumentRow } from '../rows/documents';

/**
 * Visible public records, in the editor's order and then newest first. Grouping by category is left to the page.
 * 设为显示的公开记录，先按编辑设置的排序，再按日期从新到旧排列。按类别分组由页面负责。
 */
export async function listVisibleDocuments(db: D1Database): Promise<SiteDocument[]> {
  const { results } = await db
    .prepare('SELECT * FROM documents WHERE visible = 1 ORDER BY sort_order, published_on DESC, created_at DESC')
    .all<DocumentRow>();
  return results.map(toSiteDocument);
}
