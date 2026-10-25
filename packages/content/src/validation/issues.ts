/**
 * Validation reports every problem at once, each tied to the field path the admin form shows it under, so an
 * editor fixes a whole form in one pass instead of one error per save.
 * 校验一次报告所有问题，每个问题都对应后台表单中的字段路径，编辑者一次就能改完整张表单，而不是每保存一次只看到一个错误。
 */

export interface ValidationIssue {
  /** Dot path of the field, such as "title.zh" or "contact.email". */
  /** 字段的点路径，例如 "title.zh" 或 "contact.email"。 */
  field: string;
  /** A short Chinese message for the admin, who works in Chinese. */
  /** 给后台使用者看的简短中文说明，后台以中文为工作语言。 */
  message: string;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; issues: ValidationIssue[] };

/**
 * Collects issues while a validator reads an untrusted object field by field.
 * 校验器逐个读取不可信对象的字段时，用它收集问题。
 */
export class IssueCollector {
  readonly issues: ValidationIssue[] = [];

  add(field: string, message: string): void {
    this.issues.push({ field, message });
  }

  get empty(): boolean {
    return this.issues.length === 0;
  }

  result<T>(value: T): ValidationResult<T> {
    return this.empty ? { ok: true, value } : { ok: false, issues: this.issues };
  }
}

/** A plain object from parsed JSON, or an empty one for anything else. */
/** 解析后的 JSON 普通对象；其他任何值都视为空对象。 */
export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
