import { ADMIN_API_PREFIX, type ApiErrorBody, type ValidationIssue } from '@msc-web/content';

/**
 * The one place the admin app talks to the site Worker. It adds the bearer token, turns error bodies into ApiError
 * (with per-field issues for forms), and reports a lost session so the app can ask the officer to sign in again.
 * 后台应用与网站 Worker 通信的唯一入口。它附加 Bearer 令牌，把错误响应转换为 ApiError（含表单逐字段问题），
 * 并在会话失效时发出通知，使应用请干部重新登录。
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues: ValidationIssue[] = [],
  ) {
    super(message);
  }
}

let currentToken: string | null = null;
let onSessionLost: (() => void) | null = null;

export function setApiToken(token: string | null): void {
  currentToken = token;
}

export function setSessionLostHandler(handler: (() => void) | null): void {
  onSessionLost = handler;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** JSON body. */
  /** JSON 请求体。 */
  json?: unknown;
  /** Raw body, such as a file to upload. */
  /** 原始请求体，例如要上传的文件。 */
  raw?: Blob;
  /** Use this token instead of the current one, as during sign-in. */
  /** 使用此令牌而非当前令牌，例如登录过程中。 */
  token?: string | null;
  signal?: AbortSignal;
}

async function errorFrom(response: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> | null = null;
  try {
    body = (await response.json()) as Partial<ApiErrorBody>;
  } catch {
    body = null;
  }
  const error = body?.error;
  const fallback = response.status >= 500 ? '服务器暂时无法响应，请稍后再试' : '请求失败，请重试';
  return new ApiError(response.status, error?.code ?? 'http_error', error?.message ?? fallback, error?.issues ?? []);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  const token = options.token === undefined ? currentToken : options.token;
  if (token) headers.authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.json);
  } else if (options.raw) {
    headers['content-type'] = options.raw.type || 'application/octet-stream';
    body = options.raw;
  }

  let response: Response;
  try {
    response = await fetch(`${ADMIN_API_PREFIX}${path}`, { method: options.method ?? 'GET', headers, body, signal: options.signal });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, 'network', '网络连接失败，请检查网络后重试');
  }

  if (!response.ok) {
    const error = await errorFrom(response);
    if (response.status === 401 && token && options.token === undefined) onSessionLost?.();
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
