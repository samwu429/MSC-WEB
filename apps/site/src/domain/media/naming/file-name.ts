import { MEDIA_EXTENSIONS, type MediaContentType } from '@msc-web/content';

export const MAX_FILE_NAME_LENGTH = 120;

/** Longer endings after the last dot are part of the name rather than an extension worth keeping. */
/** 最后一个点之后过长的部分视为名称的一部分，而不是值得保留的扩展名。 */
const MAX_EXTENSION_LENGTH = 10;

/** Control and invisible format characters (including bidirectional overrides), lone surrogates, and quotes. */
/** 控制字符与不可见的格式字符（包括双向文本覆盖符）、孤立的代理项以及引号。 */
const UNSAFE_CHARACTERS = /[\p{Cc}\p{Cf}\p{Cs}"'`]/gu;

function defaultName(contentType: MediaContentType): string {
  return `${contentType === 'application/pdf' ? 'document' : 'image'}.${MEDIA_EXTENSIONS[contentType]}`;
}

/** Shortens to the limit in whole characters, keeping a short extension such as ".pdf". */
/** 按完整字符截断到上限，并保留 ".pdf" 这类较短的扩展名。 */
function shorten(name: string): string {
  const characters = Array.from(name);
  if (characters.length <= MAX_FILE_NAME_LENGTH) return name;
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? Array.from(name.slice(dot)) : [];
  if (extension.length === 0 || extension.length > MAX_EXTENSION_LENGTH) return characters.slice(0, MAX_FILE_NAME_LENGTH).join('').trimEnd();
  const stem = Array.from(name.slice(0, dot)).slice(0, MAX_FILE_NAME_LENGTH - extension.length);
  return `${stem.join('').trimEnd()}${extension.join('')}`;
}

/**
 * The original file name as editors see it again later and as a PDF is saved by visitors. Only the last path segment
 * is kept, and characters that could disguise the name or break a header are dropped. A name with nothing left
 * becomes "image" or "document" with the extension of the stored type.
 * 原始文件名：编辑者之后会再次看到它，访问者保存 PDF 时也会使用它。只保留路径的最后一段，并删除可能伪装文件名或破坏响应头的字符。
 * 清理后没有剩余内容的名称改为 "image" 或 "document"，并加上所存类型的扩展名。
 */
export function sanitizeFileName(raw: string | null | undefined, contentType: MediaContentType): string {
  const lastSegment = (raw ?? '').split(/[\\/]/).pop() ?? '';
  const cleaned = lastSegment.replace(/\s+/gu, ' ').replace(UNSAFE_CHARACTERS, '').replace(/ {2,}/g, ' ').trim();
  if (!/[^.\s]/u.test(cleaned)) return defaultName(contentType);
  return shorten(cleaned);
}
