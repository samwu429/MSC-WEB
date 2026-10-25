import { ascii, matchesAt, readUint32 } from '../bytes';
import type { SniffedMedia } from '../sniffed-media';

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const IHDR = ascii('IHDR');
const IHDR_DATA_LENGTH = 13;

/** Signature (8), IHDR length and type (8), IHDR data (13) and its CRC (4). */
/** 签名（8）、IHDR 长度与类型（8）、IHDR 数据（13）及其 CRC（4）。 */
const HEADER_BYTES = 33;

/** A PNG opens with its signature and an IHDR chunk holding width and height as big-endian 32-bit integers. */
/** PNG 以签名开头，随后是以大端 32 位整数保存宽度与高度的 IHDR 数据块。 */
export function sniffPng(bytes: Uint8Array): SniffedMedia | null {
  if (bytes.length < HEADER_BYTES || !matchesAt(bytes, 0, SIGNATURE)) return null;
  if (readUint32(bytes, 8) !== IHDR_DATA_LENGTH || !matchesAt(bytes, 12, IHDR)) return null;
  const width = readUint32(bytes, 16);
  const height = readUint32(bytes, 20);
  if (!width || !height) return null;
  return { contentType: 'image/png', width, height };
}
