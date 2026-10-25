import { sniffJpeg } from './formats/jpeg';
import { sniffPdf } from './formats/pdf';
import { sniffPng } from './formats/png';
import { sniffWebp } from './formats/webp';
import type { SniffedMedia } from './sniffed-media';

const SNIFFERS = [sniffJpeg, sniffPng, sniffWebp, sniffPdf] as const;

/**
 * What an upload really is, decided from its bytes alone. The declared content type and file name come from the
 * client and are never trusted; bytes that match none of the accepted formats, or that are cut off, yield null.
 * 仅根据字节判断上传文件的真实类型。声明的内容类型与文件名来自客户端，从不被信任；不符合任何受支持格式或已被截断的字节返回 null。
 */
export function sniffMedia(bytes: Uint8Array): SniffedMedia | null {
  for (const sniff of SNIFFERS) {
    const media = sniff(bytes);
    if (media) return media;
  }
  return null;
}
