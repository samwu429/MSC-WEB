import { Hono, type Context } from 'hono';
import { MEDIA_EXTENSIONS, MEDIA_KEY_PATTERN, MEDIA_PATH_PREFIX, mediaKindOfKey } from '@msc-web/content';
import { parseByteRange } from '../../../domain/media/delivery/byte-range';
import { inlineDisposition } from '../../../domain/media/delivery/content-disposition';
import { matchesEntityTag } from '../../../domain/media/delivery/entity-tag';
import { contentTypeOfKey } from '../../../domain/media/naming/media-key';
import { getMediaObject } from '../../../infrastructure/r2/media-store';
import type { AppEnv } from '../../context';
import { IMMUTABLE } from '../static';

/**
 * GET and HEAD /media/<key>: uploaded files from the media bucket. Only keys of the server-generated shape are read,
 * so no request can reach another part of the bucket. A key never changes content, so every response is cached for
 * a year and entity tags and byte ranges need no revalidation logic.
 * GET 与 HEAD /media/<键>：媒体存储桶中的上传文件。只读取符合服务器生成形状的键，任何请求都无法访问桶内的其他部分。
 * 一个键的内容永不改变，因此每个响应都缓存一年，实体标签与字节范围也无需重新验证的逻辑。
 */
export const mediaRoutes = new Hono<AppEnv>();

/** An image opened on its own may not load anything or run anything. */
/** 单独打开的图片不得加载或运行任何内容。 */
const IMAGE_POLICY = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

const FALLBACK_DOCUMENT_NAME = 'document.pdf';

function notFoundText(c: Context<AppEnv>): Response {
  return c.text('Not Found', 404);
}

/** The stored type when it is one the site issues, otherwise the type the key's extension stands for. */
/** 若存储的类型属于网站使用的类型则采用它，否则采用键扩展名对应的类型。 */
function contentTypeFor(key: string, stored: string | undefined): string {
  if (stored && Object.hasOwn(MEDIA_EXTENSIONS, stored)) return stored;
  return contentTypeOfKey(key) ?? 'application/octet-stream';
}

function mediaHeaders(key: string, object: R2Object): Headers {
  const headers = new Headers({
    'content-type': contentTypeFor(key, object.httpMetadata?.contentType),
    'cache-control': IMMUTABLE,
    etag: object.httpEtag,
    'last-modified': object.uploaded.toUTCString(),
    'accept-ranges': 'bytes',
    'x-content-type-options': 'nosniff',
  });
  if (mediaKindOfKey(key) === 'image') headers.set('content-security-policy', IMAGE_POLICY);
  else headers.set('content-disposition', inlineDisposition(object.customMetadata?.fileName || FALLBACK_DOCUMENT_NAME));
  return headers;
}

/** A read without conditions always carries a body; anything else counts as missing. */
/** 不带条件的读取总会返回内容；其他情况视为文件不存在。 */
function hasBody(object: R2Object | R2ObjectBody | null): object is R2ObjectBody {
  return object !== null && 'body' in object;
}

/**
 * Most requests are a plain GET, answered from one read of the bucket. HEAD, 304 and range answers drop that body
 * unread, and a range is then read on its own once the file size is known. Hono answers HEAD through this GET
 * handler and drops any body it returns.
 * 大多数请求是普通 GET，只需读取存储桶一次即可应答。HEAD、304 与范围请求不传输这次读取的内容；范围请求会在得知文件大小之后
 * 再单独读取所需范围。Hono 通过此 GET 处理函数应答 HEAD，并丢弃其返回的任何内容。
 */
mediaRoutes.get('/*', async (c) => {
  const key = new URL(c.req.url).pathname.slice(MEDIA_PATH_PREFIX.length);
  if (!MEDIA_KEY_PATTERN.test(key)) return notFoundText(c);
  const object = await getMediaObject(c.env.MEDIA, key);
  if (!hasBody(object)) return notFoundText(c);

  const headers = mediaHeaders(key, object);
  if (matchesEntityTag(c.req.header('if-none-match'), object.httpEtag)) {
    await object.body.cancel();
    return new Response(null, { status: 304, headers });
  }

  const isHead = c.req.method === 'HEAD';
  const range = isHead ? null : parseByteRange(c.req.header('range'), object.size);
  if (range === null) {
    headers.set('content-length', String(object.size));
    if (!isHead) return new Response(object.body, { status: 200, headers });
    await object.body.cancel();
    return new Response(null, { status: 200, headers });
  }

  await object.body.cancel();
  if (range === 'unsatisfiable') {
    return new Response(null, { status: 416, headers: { 'content-range': `bytes */${object.size}`, 'accept-ranges': 'bytes' } });
  }
  const length = range.end - range.start + 1;
  const part = await getMediaObject(c.env.MEDIA, key, { range: { offset: range.start, length } });
  if (!hasBody(part)) return notFoundText(c);
  headers.set('content-range', `bytes ${range.start}-${range.end}/${object.size}`);
  headers.set('content-length', String(length));
  return new Response(part.body, { status: 206, headers });
});
