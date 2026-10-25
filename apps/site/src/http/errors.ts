import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiErrorBody, ValidationIssue } from '@msc-web/content';

/**
 * An error the admin API reports to the client as { error: { code, message, issues? } }. Messages are Chinese,
 * the working language of the backend. Anything else that is thrown becomes a generic 500 with no detail.
 * 后台接口以 { error: { code, message, issues? } } 形式返回给客户端的错误。提示信息为中文，即后台的工作语言。
 * 其他任何抛出的错误都会变成不含细节的通用 500 错误。
 */
export class HttpError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
    readonly issues?: ValidationIssue[],
  ) {
    super(message);
  }
}

export function badRequest(code: string, message: string): HttpError {
  return new HttpError(400, code, message);
}

export function invalid(issues: ValidationIssue[]): HttpError {
  return new HttpError(400, 'invalid', '请检查表单中标出的内容', issues);
}

export function unauthorized(message = '请先登录'): HttpError {
  return new HttpError(401, 'unauthorized', message);
}

export function forbidden(message = '你的职位没有这项权限'): HttpError {
  return new HttpError(403, 'forbidden', message);
}

export function notFound(message = '内容不存在或已被删除'): HttpError {
  return new HttpError(404, 'not_found', message);
}

export function conflict(code: string, message: string): HttpError {
  return new HttpError(409, code, message);
}

/** Someone else saved the record after this editor loaded it. */
/** 在该编辑者加载之后，已有他人保存了这条记录。 */
export function stale(): HttpError {
  return conflict('stale', '内容已被他人修改，请刷新页面后再编辑');
}

export function payloadTooLarge(message: string): HttpError {
  return new HttpError(413, 'too_large', message);
}

export function unavailable(code: string, message: string): HttpError {
  return new HttpError(503, code, message);
}

export function errorBody(error: HttpError): ApiErrorBody {
  return { error: { code: error.code, message: error.message, ...(error.issues ? { issues: error.issues } : {}) } };
}

/** The JSON response for an admin API error. Unknown errors are logged and hidden from the client. */
/** 后台接口错误的 JSON 响应。未知错误会记录日志，但不向客户端透露。 */
export function apiErrorResponse(error: unknown, c: Context): Response {
  if (error instanceof HttpError) return c.json(errorBody(error), error.status, { 'cache-control': 'no-store' });
  console.error('[admin-api]', error);
  return c.json({ error: { code: 'internal', message: '服务器出错，请稍后再试' } } satisfies ApiErrorBody, 500, { 'cache-control': 'no-store' });
}
