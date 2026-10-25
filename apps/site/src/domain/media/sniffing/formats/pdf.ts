import { ascii, indexOfBytes, matchesAt } from '../bytes';
import type { SniffedMedia } from '../sniffed-media';

const HEADER = ascii('%PDF-');
const END_OF_FILE = ascii('%%EOF');

/** Writers may follow %%EOF with line breaks or padding; anything further out means the file was cut short. */
/** 生成器可能在 %%EOF 之后追加换行或填充；离结尾更远则说明文件不完整。 */
const TRAILER_WINDOW = 2048;

/** A PDF starts with %PDF- and closes with %%EOF within the last 2048 bytes. */
/** PDF 以 %PDF- 开头，并在最后 2048 个字节内以 %%EOF 结束。 */
export function sniffPdf(bytes: Uint8Array): SniffedMedia | null {
  if (!matchesAt(bytes, 0, HEADER)) return null;
  const trailerStart = Math.max(HEADER.length, bytes.length - TRAILER_WINDOW);
  return indexOfBytes(bytes, END_OF_FILE, trailerStart) >= 0 ? { contentType: 'application/pdf', width: null, height: null } : null;
}
