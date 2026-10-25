/**
 * Uploaded files live in R2 under keys the server generates, and are served at /media/<key>. A key never changes
 * content, so it can be cached for a year. Images are JPEG, WebP or PNG; documents are PDF. SVG and HTML are never
 * accepted, because a browser would run scripts inside them on this origin.
 * 上传的文件以服务器生成的键存放在 R2，并在 /media/<键> 提供。一个键的内容永不改变，因此可以缓存一年。图片为 JPEG、WebP 或 PNG；
 * 文档为 PDF。永不接受 SVG 和 HTML，因为浏览器会在本站源下执行其中的脚本。
 */

export const MEDIA_KINDS = ['image', 'document'] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/webp', 'image/png'] as const;

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

export const DOCUMENT_CONTENT_TYPES = ['application/pdf'] as const;

export type DocumentContentType = (typeof DOCUMENT_CONTENT_TYPES)[number];

export type MediaContentType = ImageContentType | DocumentContentType;

/** The admin shrinks photos before upload, so 10 MB leaves room for a large PNG such as a QR code or poster. */
/** 后台会在上传前压缩照片，10 MB 足以容纳二维码或海报这类较大的 PNG。 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Review slides and annual accounts are the largest documents; 25 MB covers a long slide deck. */
/** 复习课件和年度账目是最大的文档；25 MB 足够容纳一份很长的课件。 */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export const MEDIA_EXTENSIONS: Record<MediaContentType, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

/**
 * img/2026/<32 hex>.jpg or doc/2026/<32 hex>.pdf. The pattern is the only shape /media serves, so a request can
 * never reach another prefix of the bucket.
 * img/2026/<32 位十六进制>.jpg 或 doc/2026/<32 位十六进制>.pdf。/media 只提供这一种形状，请求因此永远无法访问桶内的其他前缀。
 */
export const MEDIA_KEY_PATTERN = /^(img\/\d{4}\/[0-9a-f]{32}\.(?:jpg|webp|png)|doc\/\d{4}\/[0-9a-f]{32}\.pdf)$/;

export const MEDIA_PATH_PREFIX = '/media/';

export function isMediaKey(value: unknown, kind?: MediaKind): value is string {
  if (typeof value !== 'string' || !MEDIA_KEY_PATTERN.test(value)) return false;
  if (kind === 'image') return value.startsWith('img/');
  if (kind === 'document') return value.startsWith('doc/');
  return true;
}

export function mediaKindOfKey(key: string): MediaKind {
  return key.startsWith('doc/') ? 'document' : 'image';
}

export function mediaUrl(key: string): string {
  return `${MEDIA_PATH_PREFIX}${key}`;
}

export function maxBytesFor(kind: MediaKind): number {
  return kind === 'image' ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
}

/** What the server knows about one stored upload. */
/** 服务器记录的一次上传的信息。 */
export interface MediaRecord {
  key: string;
  url: string;
  kind: MediaKind;
  contentType: MediaContentType;
  size: number;
  width: number | null;
  height: number | null;
  fileName: string;
  createdAt: string;
}
