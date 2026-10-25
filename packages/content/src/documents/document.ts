import type { LocalizedText } from '../locale/locale';
import type { WallDate } from '../time/toronto';
import { IssueCollector, asRecord, type ValidationResult } from '../validation/issues';
import { readBoolean, readEnum, readInteger, readLocalizedText, readRequiredMediaKey, readWallDate } from '../validation/fields';

/**
 * Public records the constitution asks the website to carry: the constitution itself, the annual public accounts
 * (Article 13.7), election results, Department Outlines and redacted meeting records (Article 11.3). Only redacted
 * copies are uploaded; originals with personal information stay in the internal archive (Article 11.2).
 * 章程要求官网公开的记录：章程本身、年度公开账目（第 13.7 条）、选举结果、部门大纲以及经过删减的会议记录（第 11.3 条）。
 * 只上传删减后的副本；含个人信息的原件仅保存在内部档案中（第 11.2 条）。
 */
export const DOCUMENT_CATEGORIES = [
  'constitution',
  'public_accounts',
  'election_results',
  'department_outlines',
  'meeting_records',
  'other',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, LocalizedText> = {
  constitution: { zh: '章程', en: 'Constitution' },
  public_accounts: { zh: '年度公开账目', en: 'Annual Public Accounts' },
  election_results: { zh: '选举结果', en: 'Election Results' },
  department_outlines: { zh: '部门大纲', en: 'Department Outlines' },
  meeting_records: { zh: '会议记录', en: 'Meeting Records' },
  other: { zh: '其他文件', en: 'Other Documents' },
};

export interface SiteDocument {
  id: string;
  category: DocumentCategory;
  title: LocalizedText;
  /** A PDF in the media store. */
  /** 媒体库中的一份 PDF。 */
  mediaKey: string;
  publishedOn: WallDate;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type SiteDocumentInput = Omit<SiteDocument, 'id' | 'createdAt' | 'updatedAt'>;

export const DOCUMENT_LIMITS = {
  title: 160,
} as const;

export function validateDocumentInput(raw: unknown): ValidationResult<SiteDocumentInput> {
  const issues = new IssueCollector();
  const body = asRecord(raw);
  const value: SiteDocumentInput = {
    category: readEnum(issues, body.category, 'category', DOCUMENT_CATEGORIES, '文件类别'),
    title: readLocalizedText(issues, body.title, 'title', { label: '文件标题', max: DOCUMENT_LIMITS.title, required: true }),
    mediaKey: readRequiredMediaKey(issues, body.mediaKey, 'mediaKey', 'document', 'PDF 文件'),
    publishedOn: readWallDate(issues, body.publishedOn, 'publishedOn', '发布日期'),
    visible: readBoolean(issues, body.visible, 'visible', '是否显示', true),
    sortOrder: readInteger(issues, body.sortOrder, 'sortOrder', { label: '排序', min: 0, max: 9999, fallback: 0 }),
  };
  return issues.result(value);
}
