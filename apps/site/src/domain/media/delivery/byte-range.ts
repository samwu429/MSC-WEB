/** An inclusive byte range within a stored file. */
/** 存储文件中的闭区间字节范围。 */
export interface ByteRange {
  start: number;
  end: number;
}

const SINGLE_RANGE = /^bytes=(\d*)-(\d*)$/i;

/**
 * The single range a Range header asks for within a file of `size` bytes. Null means the header is absent, malformed,
 * lists several ranges or uses another unit, and the whole file is served, as RFC 9110 lets a server ignore such a
 * header. "unsatisfiable" means the range starts past the end and the answer is 416. Numbers beyond the safe integer
 * range still compare correctly against any real size, so they need no special case.
 * Range 请求头在一个 `size` 字节的文件中所请求的单个范围。返回 null 表示请求头不存在、格式错误、包含多个范围或使用其他单位，
 * 此时提供整个文件，RFC 9110 允许服务器忽略这样的请求头。"unsatisfiable" 表示范围起点超出文件末尾，应答 416。
 * 超出安全整数范围的数字与任何实际大小比较时仍然正确，因此无需特殊处理。
 */
export function parseByteRange(header: string | null | undefined, size: number): ByteRange | 'unsatisfiable' | null {
  const match = header ? SINGLE_RANGE.exec(header.trim()) : null;
  if (!match) return null;
  const [, first = '', last = ''] = match;
  if (!first && !last) return null;

  if (!first) {
    const suffix = Number(last);
    if (suffix === 0 || size === 0) return 'unsatisfiable';
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }

  const start = Number(first);
  const end = last ? Number(last) : Number.POSITIVE_INFINITY;
  if (end < start) return null;
  if (start >= size) return 'unsatisfiable';
  return { start, end: Math.min(end, size - 1) };
}
