function opaqueTag(tag: string): string {
  return tag.startsWith('W/') ? tag.slice(2) : tag;
}

/**
 * Whether an If-None-Match header names the stored entity tag. The comparison is weak, as RFC 9110 requires for
 * If-None-Match, so W/"x" and "x" are the same tag, and "*" matches any stored file.
 * If-None-Match 请求头是否包含所存文件的实体标签。按 RFC 9110 对 If-None-Match 的要求使用弱比较，因此 W/"x" 与 "x" 视为同一标签，
 * "*" 匹配任何已存储的文件。
 */
export function matchesEntityTag(header: string | null | undefined, etag: string): boolean {
  if (!header) return false;
  const stored = opaqueTag(etag);
  return header.split(',').some((candidate) => {
    const tag = candidate.trim();
    return tag === '*' || opaqueTag(tag) === stored;
  });
}
