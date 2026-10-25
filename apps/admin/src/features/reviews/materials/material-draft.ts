import { emptyText, materialLabel, pickText, type LocalizedText, type MaterialKind, type ReviewMaterial, type ReviewMaterialInput } from '@msc-web/content';
import type { IssueMap } from '../../../shared/forms/issues';

/** A material is either an uploaded PDF or a link, never both. */
/** 资料要么是上传的 PDF，要么是一个链接，二者不能同时提供。 */
export type MaterialSource = 'upload' | 'link';

export interface MaterialDraft {
  kind: MaterialKind;
  label: LocalizedText;
  source: MaterialSource;
  mediaKey: string | null;
  url: string;
  sortOrder: number;
}

const MAX_SORT_ORDER = 9999;

/** One past the largest sort order in use, so a new material lands at the end of the list. */
/** 比当前最大排序值大一，新资料因此排在列表末尾。 */
export function nextSortOrder(materials: readonly Pick<ReviewMaterial, 'sortOrder'>[]): number {
  const largest = materials.reduce((max, material) => Math.max(max, material.sortOrder), -1);
  return Math.min(largest + 1, MAX_SORT_ORDER);
}

export function materialDraftOf(material: ReviewMaterial | null, existing: readonly ReviewMaterial[]): MaterialDraft {
  if (!material) return { kind: 'slides', label: emptyText(), source: 'upload', mediaKey: null, url: '', sortOrder: nextSortOrder(existing) };
  return {
    kind: material.kind,
    label: material.label,
    source: material.url ? 'link' : 'upload',
    mediaKey: material.mediaKey,
    url: material.url ?? '',
    sortOrder: material.sortOrder,
  };
}

/**
 * Sends only the chosen source. A file uploaded before switching to a link is never attached, so the daily
 * cleanup of unused uploads removes it.
 * 只发送所选的来源。切换为链接前上传的文件不会被关联，每日清理未使用上传的任务会将其删除。
 */
export function materialInputOf(draft: MaterialDraft): ReviewMaterialInput {
  const link = draft.source === 'link';
  return {
    kind: draft.kind,
    label: draft.label,
    mediaKey: link ? null : draft.mediaKey,
    url: link ? draft.url.trim() || null : null,
    sortOrder: draft.sortOrder,
  };
}

/**
 * The server reports a missing file or link under one field, but only the chosen source's control is on screen,
 * so an issue for the hidden control is shown under the visible one.
 * 服务器把缺少文件或链接的问题报告在其中一个字段上，而屏幕上只显示所选来源的控件，因此隐藏控件的问题改为显示在可见控件下方。
 */
export function issuesForSource(issues: IssueMap, source: MaterialSource): IssueMap {
  const visible = source === 'link' ? 'url' : 'mediaKey';
  const hidden = source === 'link' ? 'mediaKey' : 'url';
  const message = issues.get(hidden);
  if (!message || issues.has(visible)) return issues;
  const moved = new Map(issues);
  moved.set(visible, message);
  return moved;
}

/** The name the material list shows: the Chinese label, else the English one, else the kind's name. */
/** 资料列表显示的名称：中文名称，其次英文名称，都没有时为资料类型名称。 */
export function materialListLabel(material: Pick<ReviewMaterial, 'kind' | 'label'>): string {
  return pickText(materialLabel(material), 'zh');
}

/** Puts a saved material in place of its previous version, ordered by sort order and then by creation time. */
/** 用已保存的资料替换其旧版本，并按排序值、再按创建时间排列。 */
export function placeMaterial(materials: readonly ReviewMaterial[], saved: ReviewMaterial): ReviewMaterial[] {
  return [...materials.filter((material) => material.id !== saved.id), saved].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.createdAt === b.createdAt) return 0;
    return a.createdAt < b.createdAt ? -1 : 1;
  });
}
