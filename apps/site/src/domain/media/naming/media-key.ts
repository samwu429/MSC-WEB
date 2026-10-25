import { MEDIA_EXTENSIONS, type MediaContentType } from '@msc-web/content';

const KEY_PREFIXES: Record<MediaContentType, 'img' | 'doc'> = {
  'image/jpeg': 'img',
  'image/webp': 'img',
  'image/png': 'img',
  'application/pdf': 'doc',
};

const CONTENT_TYPES_BY_EXTENSION = new Map(
  (Object.entries(MEDIA_EXTENSIONS) as [MediaContentType, string][]).map(([contentType, extension]) => [extension, contentType]),
);

/**
 * A new storage key such as img/2026/<32 hex>.jpg. The 128 random bits come from the platform's secure generator,
 * so keys can neither collide nor be guessed, and the extension follows the type found in the bytes.
 * 新的存储键，例如 img/2026/<32 位十六进制>.jpg。128 位随机数来自平台的安全随机数生成器，因此键既不会冲突也无法被猜测；
 * 扩展名取决于从字节中识别出的类型。
 */
export function newMediaKey(contentType: MediaContentType, now: Date = new Date()): string {
  const random = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${KEY_PREFIXES[contentType]}/${now.getUTCFullYear()}/${hex}.${MEDIA_EXTENSIONS[contentType]}`;
}

/** The content type a key's extension stands for, or null for an extension the site never issues. */
/** 键的扩展名对应的内容类型；网站从不使用的扩展名返回 null。 */
export function contentTypeOfKey(key: string): MediaContentType | null {
  return CONTENT_TYPES_BY_EXTENSION.get(key.slice(key.lastIndexOf('.') + 1)) ?? null;
}
