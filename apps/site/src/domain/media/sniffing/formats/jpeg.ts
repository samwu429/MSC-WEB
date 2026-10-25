import { readUint16, readUint8 } from '../bytes';
import type { SniffedMedia } from '../sniffed-media';

const MARKER_PREFIX = 0xff;
const START_OF_IMAGE = 0xd8;
const END_OF_IMAGE = 0xd9;
const START_OF_SCAN = 0xda;

/** Start-of-frame markers, which carry the image size: C0-C3, C5-C7, C9-CB and CD-CF (C4, C8 and CC are tables). */
/** 携带图片尺寸的帧起始标记：C0-C3、C5-C7、C9-CB 与 CD-CF（C4、C8 与 CC 是表定义）。 */
const START_OF_FRAME = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

/** Length, precision, height and width: the part of a frame header that is read. */
/** 长度、精度、高度与宽度：帧头中需要读取的部分。 */
const FRAME_HEADER_BYTES = 7;

/** TEM and RST0-RST7 stand alone without a length field. */
/** TEM 与 RST0-RST7 单独出现，没有长度字段。 */
function isStandalone(marker: number): boolean {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7);
}

/**
 * Whether an end-of-image marker follows the scan. Entropy-coded data escapes every 0xFF, so FF D9 after the scan
 * starts can only be the real end, and bytes some cameras append after it are tolerated.
 * 扫描数据之后是否有图像结束标记。熵编码数据会转义所有 0xFF，因此扫描开始之后出现的 FF D9 只可能是真正的结束标记；
 * 部分相机在其后追加的字节也被容许。
 */
function hasEndOfImage(bytes: Uint8Array, scanStart: number): boolean {
  let index = bytes.lastIndexOf(END_OF_IMAGE);
  while (index - 1 >= scanStart) {
    if (bytes[index - 1] === MARKER_PREFIX) return true;
    index = bytes.lastIndexOf(END_OF_IMAGE, index - 1);
  }
  return false;
}

/**
 * A JPEG runs from SOI to EOI. The segments before the first scan are walked one by one; the frame header among them
 * gives the size, and a file whose segments run past its end, or that has no frame before the scan, is refused.
 * JPEG 从 SOI 开始，到 EOI 结束。逐个遍历第一次扫描之前的段，其中的帧头给出尺寸；段长度超出文件末尾，或扫描之前没有帧头的文件会被拒绝。
 */
export function sniffJpeg(bytes: Uint8Array): SniffedMedia | null {
  if (readUint8(bytes, 0) !== MARKER_PREFIX || readUint8(bytes, 1) !== START_OF_IMAGE) return null;
  let offset = 2;
  let size: { width: number; height: number } | null = null;
  for (;;) {
    if (readUint8(bytes, offset) !== MARKER_PREFIX) return null;
    while (readUint8(bytes, offset) === MARKER_PREFIX) offset += 1;
    const marker = readUint8(bytes, offset);
    if (marker === null || marker === START_OF_IMAGE || marker === END_OF_IMAGE) return null;
    offset += 1;
    if (isStandalone(marker)) continue;

    const length = readUint16(bytes, offset);
    if (length === null || length < 2 || offset + length > bytes.length) return null;
    if (START_OF_FRAME.has(marker)) {
      const height = length >= FRAME_HEADER_BYTES ? readUint16(bytes, offset + 3) : null;
      const width = length >= FRAME_HEADER_BYTES ? readUint16(bytes, offset + 5) : null;
      if (!width || !height) return null;
      size = { width, height };
    }
    if (marker === START_OF_SCAN) {
      return size && hasEndOfImage(bytes, offset + length) ? { contentType: 'image/jpeg', ...size } : null;
    }
    offset += length;
  }
}
