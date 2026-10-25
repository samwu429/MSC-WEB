import type { ValidationIssue } from '@msc-web/content';
import { ApiError } from '../api/client';

/**
 * Field errors from the server, looked up by the same dot paths the shared validators use ("title.zh",
 * "contact.email"). The server is the only validator, so the form and the API can never disagree on the rules.
 * 服务器返回的字段错误，按共享校验器使用的点路径查找（"title.zh"、"contact.email"）。只有服务器负责校验，因此表单与接口的规则永远不会不一致。
 */
export type IssueMap = ReadonlyMap<string, string>;

export const NO_ISSUES: IssueMap = new Map();

export function issueMap(issues: readonly ValidationIssue[]): IssueMap {
  const map = new Map<string, string>();
  for (const issue of issues) if (!map.has(issue.field)) map.set(issue.field, issue.message);
  return map;
}

/** The issues of a failed save, or none when the error was not about fields. */
/** 保存失败时的字段问题；若错误与字段无关则为空。 */
export function issuesOf(error: unknown): IssueMap {
  return error instanceof ApiError ? issueMap(error.issues) : NO_ISSUES;
}

/** A message for the top of a form. */
/** 显示在表单顶部的提示。 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return '操作失败，请重试';
}
