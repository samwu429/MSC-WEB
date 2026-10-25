import { hasText, type LocalizedText } from '../locale/locale';
import { IssueCollector, asRecord, type ValidationResult } from '../validation/issues';
import { readEnum, readInteger, readLocalizedText, readOptionalMediaKey, readOptionalUrl } from '../validation/fields';

/**
 * Study material attached to a review session: an uploaded PDF or a link (for example a shared folder). Exactly
 * one of the two is set. Materials are study aids written by the Academic Department, never graded coursework,
 * as Article 2.3 of the constitution requires.
 * 复习场次附带的学习资料：上传的 PDF 或一个链接（例如共享文件夹），二者恰好有一个。资料是学术部编写的学习辅助材料，
 * 绝不是需要评分的课程作业，这是章程第 2.3 条的要求。
 */
export const MATERIAL_KINDS = ['slides', 'notes', 'practice', 'solutions', 'other'] as const;

export type MaterialKind = (typeof MATERIAL_KINDS)[number];

export const MATERIAL_KIND_LABELS: Record<MaterialKind, LocalizedText> = {
  slides: { zh: '课件', en: 'Slides' },
  notes: { zh: '笔记', en: 'Notes' },
  practice: { zh: '练习题', en: 'Practice problems' },
  solutions: { zh: '参考答案', en: 'Solutions' },
  other: { zh: '其他资料', en: 'Other' },
};

export interface ReviewMaterial {
  id: string;
  sessionId: string;
  kind: MaterialKind;
  /** Empty uses the kind label. */
  /** 留空时使用资料类型名称。 */
  label: LocalizedText;
  mediaKey: string | null;
  url: string | null;
  sortOrder: number;
  createdAt: string;
}

export type ReviewMaterialInput = Omit<ReviewMaterial, 'id' | 'sessionId' | 'createdAt'>;

export const MATERIAL_LIMITS = {
  label: 120,
  /** Materials per session, which keeps the edit form and the public session card readable. */
  /** 每场复习的资料数量上限，使编辑表单与公开页面的场次卡片保持易读。 */
  perSession: 30,
} as const;

export function validateReviewMaterialInput(raw: unknown): ValidationResult<ReviewMaterialInput> {
  const issues = new IssueCollector();
  const body = asRecord(raw);
  const mediaKey = readOptionalMediaKey(issues, body.mediaKey, 'mediaKey', 'document', '资料文件');
  const url = readOptionalUrl(issues, body.url, 'url', { label: '资料链接' });
  if (mediaKey && url) issues.add('url', '请只上传文件或只填写链接，不要同时提供');
  if (!mediaKey && !url && !issues.issues.some((issue) => issue.field === 'mediaKey' || issue.field === 'url')) {
    issues.add('mediaKey', '请上传 PDF 文件或填写资料链接');
  }
  const value: ReviewMaterialInput = {
    kind: readEnum(issues, body.kind, 'kind', MATERIAL_KINDS, '资料类型'),
    label: readLocalizedText(issues, body.label, 'label', { label: '资料名称', max: MATERIAL_LIMITS.label }),
    mediaKey,
    url,
    sortOrder: readInteger(issues, body.sortOrder, 'sortOrder', { label: '排序', min: 0, max: 9999, fallback: 0 }),
  };
  return issues.result(value);
}

/**
 * The editor's label while either language has one, so pickText falls back to the other language before the kind
 * label; the kind label only when both are empty.
 * 只要任一语言填写了资料名称就使用编辑者的名称，使 pickText 先改用另一种语言，而不是资料类型名称；两种语言都为空时才使用资料类型名称。
 */
export function materialLabel(material: Pick<ReviewMaterial, 'kind' | 'label'>): LocalizedText {
  return hasText(material.label) ? material.label : MATERIAL_KIND_LABELS[material.kind];
}
