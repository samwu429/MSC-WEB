import type { MediaKind, ValidationIssue } from '@msc-web/content';
import { missingMediaKeys } from '../../infrastructure/d1/media';
import { invalid } from '../errors';

export interface MediaReference {
  /** Form field the key came from, for the error message. */
  /** 键所在的表单字段，用于错误提示。 */
  field: string;
  key: string | null;
  kind: MediaKind;
}

export function missingFile(field: string): ValidationIssue {
  return { field, message: '文件不存在，请重新上传' };
}

/**
 * Checks that every referenced upload exists before a save, so the editor sees "please upload again" on the right
 * field instead of a foreign key failure.
 * 保存前检查所引用的每个上传文件都存在，编辑者因此会在对应字段看到 "请重新上传"，而不是外键错误。
 */
export async function requireMediaKeys(db: D1Database, references: readonly MediaReference[]): Promise<void> {
  const issues: ValidationIssue[] = [];
  for (const kind of ['image', 'document'] as const) {
    const ofKind = references.filter((reference): reference is MediaReference & { key: string } => reference.kind === kind && Boolean(reference.key));
    if (ofKind.length === 0) continue;
    const missing = new Set(await missingMediaKeys(db, ofKind.map((reference) => reference.key), kind));
    for (const reference of ofKind) {
      if (missing.has(reference.key)) issues.push(missingFile(reference.field));
    }
  }
  if (issues.length > 0) throw invalid(issues);
}
