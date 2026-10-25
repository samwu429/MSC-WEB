import type { LocalizedText } from '../locale/locale';
import { isMediaKey, type MediaKind } from '../media/media';
import { isWallDate, isWallTime, type WallDate, type WallTime } from '../time/toronto';
import { asRecord, type IssueCollector } from './issues';

/**
 * Field readers shared by every entity validator. Each one reads a value from untrusted JSON, records an issue
 * under the field path when the value is unusable, and always returns something of the right type so the
 * validator can keep going and report every problem in the form at once.
 * 所有实体校验器共用的字段读取函数。每个函数从不可信的 JSON 中读取一个值，值不可用时在对应字段路径下记录问题，
 * 并且总是返回正确类型的值，使校验器可以继续读取，一次报告表单中的全部问题。
 */

/** ASCII control characters other than tab and newline never belong in site text. */
/** 除制表符和换行符以外的 ASCII 控制字符不应出现在网站文字中。 */
function isControlCharacter(code: number): boolean {
  return (code < 0x20 && code !== 0x09 && code !== 0x0a) || code === 0x7f;
}

/** Trims, unifies line endings and removes control characters. */
/** 去除首尾空白、统一换行符并删除控制字符。 */
export function cleanText(value: string): string {
  let kept = '';
  for (const character of value.replace(/\r\n?/g, '\n')) {
    if (!isControlCharacter(character.charCodeAt(0))) kept += character;
  }
  return kept.trim();
}

/** Length in characters as a reader counts them, so one emoji counts once. */
/** 按读者理解的字符数计算长度，一个表情符号只算一个字符。 */
export function characterCount(value: string): number {
  return Array.from(value).length;
}

export interface TextRule {
  /** Field name in Chinese for messages, such as "标题". */
  /** 用于提示信息的中文字段名，例如 "标题"。 */
  label: string;
  max: number;
  required?: boolean;
  /** Single-line fields reject newlines. */
  /** 单行字段不接受换行。 */
  multiline?: boolean;
}

export function readText(issues: IssueCollector, value: unknown, field: string, rule: TextRule): string {
  if (value === undefined || value === null) {
    if (rule.required) issues.add(field, `请填写${rule.label}`);
    return '';
  }
  if (typeof value !== 'string') {
    issues.add(field, `${rule.label}格式不正确`);
    return '';
  }
  let text = cleanText(value);
  if (!rule.multiline && text.includes('\n')) text = text.replace(/\s*\n\s*/g, ' ');
  if (rule.required && !text) issues.add(field, `请填写${rule.label}`);
  if (characterCount(text) > rule.max) issues.add(field, `${rule.label}不能超过 ${rule.max} 个字`);
  return text;
}

/**
 * Both languages of one field. `required` means at least one language must be filled; the other may stay empty
 * and the site falls back to the filled one.
 * 一个字段的两种语言。`required` 表示至少填写一种语言；另一种可以留空，网站会改用已填写的语言。
 */
export function readLocalizedText(issues: IssueCollector, value: unknown, field: string, rule: TextRule): LocalizedText {
  const record = asRecord(value);
  const sideRule = { ...rule, required: false };
  const text = {
    zh: readText(issues, record.zh, `${field}.zh`, sideRule),
    en: readText(issues, record.en, `${field}.en`, sideRule),
  };
  if (rule.required && !text.zh && !text.en) issues.add(`${field}.zh`, `请至少用一种语言填写${rule.label}`);
  return text;
}

export interface UrlRule {
  label: string;
  /** Also accept a path on this site such as /UTMMSC/. Protocol-relative //host is never accepted. */
  /** 同时接受本站路径，例如 /UTMMSC/。永不接受 //host 形式的协议相对地址。 */
  allowSitePath?: boolean;
}

export const MAX_URL_LENGTH = 500;

const SITE_ORIGIN = 'https://site.invalid';

/**
 * A path that stays on this site once a browser resolves it. Browsers drop tabs and newlines and read a backslash
 * as a slash, so "/\t/host" or "/\host" would become //host; whitespace and backslashes are refused outright and
 * the resolved origin is checked as well.
 * 浏览器解析后仍留在本站的路径。浏览器会去掉制表符与换行，并把反斜杠当作斜杠，因此 "/\t/host" 或 "/\host" 会变成 //host；
 * 这里直接拒绝空白与反斜杠，并再检查解析后的来源。
 */
function isSitePath(text: string): boolean {
  if (!text.startsWith('/') || /[\s\\]/.test(text)) return false;
  try {
    return new URL(text, SITE_ORIGIN).origin === SITE_ORIGIN;
  } catch {
    return false;
  }
}

/** An http(s) address without embedded credentials, or a site path when allowed. Empty means none. */
/** 不含用户名密码的 http(s) 地址；允许时也可以是本站路径。留空表示没有。 */
export function readOptionalUrl(issues: IssueCollector, value: unknown, field: string, rule: UrlRule): string | null {
  const text = readText(issues, value, field, { label: rule.label, max: MAX_URL_LENGTH });
  if (!text) return null;
  if (rule.allowSitePath && isSitePath(text)) return text;
  if (!isSafeHttpUrl(text)) {
    issues.add(field, `${rule.label}必须是以 https:// 或 http:// 开头的完整网址`);
    return null;
  }
  return text;
}

export function isSafeHttpUrl(text: string): boolean {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return false;
  }
  return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password && url.hostname !== '';
}

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

export function readOptionalEmail(issues: IssueCollector, value: unknown, field: string, label: string): string | null {
  const text = readText(issues, value, field, { label, max: 254 });
  if (!text) return null;
  if (!EMAIL.test(text)) {
    issues.add(field, `${label}格式不正确`);
    return null;
  }
  return text.toLowerCase();
}

export function readEnum<T extends string>(issues: IssueCollector, value: unknown, field: string, allowed: readonly T[], label: string): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T;
  issues.add(field, `请选择${label}`);
  return allowed[0] as T;
}

export function readInteger(issues: IssueCollector, value: unknown, field: string, rule: { label: string; min: number; max: number; fallback: number }): number {
  if (value === undefined || value === null || value === '') return rule.fallback;
  const number = typeof value === 'string' ? Number(value) : value;
  if (typeof number !== 'number' || !Number.isInteger(number) || number < rule.min || number > rule.max) {
    issues.add(field, `${rule.label}必须是 ${rule.min} 到 ${rule.max} 之间的整数`);
    return rule.fallback;
  }
  return number;
}

export function readBoolean(issues: IssueCollector, value: unknown, field: string, label: string, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  issues.add(field, `${label}格式不正确`);
  return fallback;
}

export function readOptionalMediaKey(issues: IssueCollector, value: unknown, field: string, kind: MediaKind, label: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (isMediaKey(value, kind)) return value;
  issues.add(field, `${label}无效，请重新上传`);
  return null;
}

export function readRequiredMediaKey(issues: IssueCollector, value: unknown, field: string, kind: MediaKind, label: string): string {
  if (isMediaKey(value, kind)) return value;
  issues.add(field, value ? `${label}无效，请重新上传` : `请上传${label}`);
  return '';
}

export function readWallTime(issues: IssueCollector, value: unknown, field: string, label: string): WallTime {
  if (isWallTime(value)) return value;
  issues.add(field, `请填写有效的${label}`);
  return '';
}

export function readOptionalWallTime(issues: IssueCollector, value: unknown, field: string, label: string): WallTime | null {
  if (value === undefined || value === null || value === '') return null;
  return readWallTime(issues, value, field, label) || null;
}

export function readWallDate(issues: IssueCollector, value: unknown, field: string, label: string): WallDate {
  if (isWallDate(value)) return value;
  issues.add(field, `请填写有效的${label}`);
  return '';
}

/** The end must not come before the start when both are present. */
/** 两者都存在时，结束时间不得早于开始时间。 */
export function checkTimeOrder(issues: IssueCollector, startsAt: WallTime | null, endsAt: WallTime | null, field: string): void {
  if (startsAt && endsAt && endsAt < startsAt) issues.add(field, '结束时间不能早于开始时间');
}
