/**
 * Bounds-checked reads over untrusted upload bytes. A read past the end returns null, so a truncated file is
 * reported as unrecognised instead of being read as zeros.
 * 对不可信上传字节进行带边界检查的读取。越界读取返回 null，截断的文件因此被判定为无法识别，而不会被当作零值读取。
 */

function fits(bytes: Uint8Array, offset: number, length: number): boolean {
  return offset >= 0 && offset + length <= bytes.length;
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

export function readUint8(bytes: Uint8Array, offset: number): number | null {
  return fits(bytes, offset, 1) ? view(bytes).getUint8(offset) : null;
}

export function readUint16(bytes: Uint8Array, offset: number, littleEndian = false): number | null {
  return fits(bytes, offset, 2) ? view(bytes).getUint16(offset, littleEndian) : null;
}

export function readUint24LE(bytes: Uint8Array, offset: number): number | null {
  const low = readUint16(bytes, offset, true);
  const high = readUint8(bytes, offset + 2);
  return low === null || high === null ? null : low + high * 0x10000;
}

export function readUint32(bytes: Uint8Array, offset: number, littleEndian = false): number | null {
  return fits(bytes, offset, 4) ? view(bytes).getUint32(offset, littleEndian) : null;
}

export function ascii(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function matchesAt(bytes: Uint8Array, offset: number, expected: ArrayLike<number>): boolean {
  if (!fits(bytes, offset, expected.length)) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (bytes[offset + index] !== expected[index]) return false;
  }
  return true;
}

/** The first index at or after `from` where `expected` starts, or -1. */
/** `expected` 在 `from` 及其之后首次出现的位置；未出现时为 -1。 */
export function indexOfBytes(bytes: Uint8Array, expected: ArrayLike<number>, from: number): number {
  for (let index = Math.max(0, from); index + expected.length <= bytes.length; index += 1) {
    if (matchesAt(bytes, index, expected)) return index;
  }
  return -1;
}
