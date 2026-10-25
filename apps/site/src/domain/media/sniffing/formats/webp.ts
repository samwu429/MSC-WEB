import { ascii, matchesAt, readUint16, readUint24LE, readUint32, readUint8 } from '../bytes';
import type { SniffedMedia } from '../sniffed-media';

const RIFF = ascii('RIFF');
const WEBP = ascii('WEBP');
const LOSSY = ascii('VP8 ');
const LOSSLESS = ascii('VP8L');
const EXTENDED = ascii('VP8X');

const LOSSY_START_CODE = [0x9d, 0x01, 0x2a];
const LOSSLESS_SIGNATURE = 0x2f;
const FOURTEEN_BITS = 0x3fff;

/** Bit 1 of the VP8X flags marks an animation; the site accepts still images only. */
/** VP8X 标志的第 1 位表示动画；网站只接受静态图片。 */
const ANIMATION_FLAG = 0x02;

/** The first chunk header follows "RIFF", the RIFF size and "WEBP"; its payload starts 8 bytes later. */
/** 第一个数据块头位于 "RIFF"、RIFF 大小与 "WEBP" 之后；其数据从 8 个字节之后开始。 */
const FIRST_CHUNK = 12;
const PAYLOAD = FIRST_CHUNK + 8;

type Size = { width: number; height: number };

/** Lossy: a key frame tag, the start code, then 14-bit width and height. */
/** 有损格式：关键帧标记、起始码，随后是 14 位的宽度与高度。 */
function lossySize(bytes: Uint8Array, chunkSize: number): Size | null {
  const frameTag = readUint8(bytes, PAYLOAD);
  if (chunkSize < 10 || frameTag === null || (frameTag & 0x01) !== 0 || !matchesAt(bytes, PAYLOAD + 3, LOSSY_START_CODE)) return null;
  const width = (readUint16(bytes, PAYLOAD + 6, true) ?? 0) & FOURTEEN_BITS;
  const height = (readUint16(bytes, PAYLOAD + 8, true) ?? 0) & FOURTEEN_BITS;
  return width && height ? { width, height } : null;
}

/** Lossless: a signature byte, then width - 1 and height - 1 in 14 bits each and a 3-bit version that must be 0. */
/** 无损格式：一个签名字节，随后是各占 14 位的宽度减一与高度减一，以及必须为 0 的 3 位版本号。 */
function losslessSize(bytes: Uint8Array, chunkSize: number): Size | null {
  const bits = readUint32(bytes, PAYLOAD + 1, true);
  if (chunkSize < 5 || readUint8(bytes, PAYLOAD) !== LOSSLESS_SIGNATURE || bits === null || bits >>> 29 !== 0) return null;
  return { width: (bits & FOURTEEN_BITS) + 1, height: ((bits >>> 14) & FOURTEEN_BITS) + 1 };
}

/** Extended: flags, three reserved bytes, then canvas width - 1 and height - 1 in 24 bits each. */
/** 扩展格式：标志字节、三个保留字节，随后是各占 24 位的画布宽度减一与高度减一。 */
function extendedSize(bytes: Uint8Array, chunkSize: number): Size | null {
  const flags = readUint8(bytes, PAYLOAD);
  const width = readUint24LE(bytes, PAYLOAD + 4);
  const height = readUint24LE(bytes, PAYLOAD + 7);
  if (chunkSize < 10 || flags === null || (flags & ANIMATION_FLAG) !== 0 || width === null || height === null) return null;
  return { width: width + 1, height: height + 1 };
}

/**
 * A still WebP: a RIFF container whose first chunk is VP8 (lossy), VP8L (lossless) or VP8X (extended, refused when
 * it declares an animation). The RIFF size counts every byte after its own field, so a shorter file was cut off.
 * 静态 WebP：一个 RIFF 容器，其第一个数据块为 VP8（有损）、VP8L（无损）或 VP8X（扩展格式，声明动画时拒绝）。
 * RIFF 大小计入其字段之后的所有字节，文件比它短即说明已被截断。
 */
export function sniffWebp(bytes: Uint8Array): SniffedMedia | null {
  if (!matchesAt(bytes, 0, RIFF) || !matchesAt(bytes, 8, WEBP)) return null;
  const riffSize = readUint32(bytes, 4, true);
  const chunkSize = readUint32(bytes, FIRST_CHUNK + 4, true);
  if (riffSize === null || riffSize + 8 > bytes.length || chunkSize === null || PAYLOAD + chunkSize > bytes.length) return null;

  let size: Size | null = null;
  if (matchesAt(bytes, FIRST_CHUNK, LOSSY)) size = lossySize(bytes, chunkSize);
  else if (matchesAt(bytes, FIRST_CHUNK, LOSSLESS)) size = losslessSize(bytes, chunkSize);
  else if (matchesAt(bytes, FIRST_CHUNK, EXTENDED)) size = extendedSize(bytes, chunkSize);
  return size ? { contentType: 'image/webp', ...size } : null;
}
