import type { Context } from 'hono';
import { asRecord, type ValidationResult, type VersionedBody } from '@msc-web/content';
import { badRequest, invalid, payloadTooLarge, type HttpError } from '../errors';

/** Form bodies are small; the largest is an event with a 10,000-character text in two languages. */
/** 表单请求体很小；最大的是一篇两种语言、各一万字正文的活动。 */
export const MAX_JSON_BYTES = 256 * 1024;

/**
 * The request body, read no further than `limit` bytes. A declared length over the limit is refused before reading,
 * and a body that grows past it anyway, such as a chunked one with no declared length, is cancelled at that point,
 * so an oversized request never fills memory.
 * 读取请求体，但不超过 `limit` 字节。声明的长度超过上限时在读取前即拒绝；实际内容超过上限时（例如未声明长度的分块请求），
 * 在超出处取消读取，因此过大的请求永远不会占满内存。
 */
export async function readBoundedBytes(request: Request, limit: number, tooLarge: () => HttpError): Promise<Uint8Array> {
  if (Number(request.headers.get('content-length') ?? '0') > limit) throw tooLarge();
  if (!request.body) return new Uint8Array(0);

  const reader: ReadableStreamDefaultReader<Uint8Array> = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw tooLarge();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** Parses a JSON request body, refusing oversized or malformed input. */
/** 解析 JSON 请求体，拒绝过大或格式错误的输入。 */
export async function readJsonBody(c: Context): Promise<unknown> {
  const bytes = await readBoundedBytes(c.req.raw, MAX_JSON_BYTES, () => payloadTooLarge('提交的内容过大'));
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw badRequest('invalid_json', '提交的内容格式不正确');
  }
}

/**
 * The body of an update: { value, expectedUpdatedAt }. The version is required so that two officers editing the
 * same record cannot silently overwrite each other.
 * 更新请求的请求体：{ value, expectedUpdatedAt }。版本号是必填的，两位干部同时编辑同一条记录时就不会悄无声息地互相覆盖。
 */
export async function readVersionedBody(c: Context): Promise<VersionedBody<unknown>> {
  const body = asRecord(await readJsonBody(c));
  if (typeof body.expectedUpdatedAt !== 'string' || !body.expectedUpdatedAt) throw badRequest('missing_version', '请刷新页面后再保存');
  return { value: body.value, expectedUpdatedAt: body.expectedUpdatedAt };
}

/** The validated value, or a 400 listing every issue. */
/** 返回校验通过的值；否则返回列出全部问题的 400 错误。 */
export function validOrThrow<T>(result: ValidationResult<T>): T {
  if (!result.ok) throw invalid(result.issues);
  return result.value;
}
