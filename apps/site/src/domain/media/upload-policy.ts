import { DOCUMENT_CONTENT_TYPES, IMAGE_CONTENT_TYPES, type MediaContentType, type MediaKind } from '@msc-web/content';
import { sniffMedia } from './sniffing/sniff';
import type { SniffedMedia } from './sniffing/sniffed-media';

/**
 * Larger images would take more memory to decode in a visitor's browser than the site ever needs; the admin shrinks
 * photos long before these limits.
 * 更大的图片在访问者浏览器中解码所需的内存远超网站所需；后台在上传前就会把照片缩小到远低于这些上限。
 */
export const MAX_IMAGE_SIDE = 12_000;
export const MAX_IMAGE_PIXELS = 60_000_000;

const ACCEPTED_TYPES: Record<MediaKind, readonly MediaContentType[]> = {
  image: IMAGE_CONTENT_TYPES,
  document: DOCUMENT_CONTENT_TYPES,
};

export type UploadRejection = 'unsupported_type' | 'image_too_large';

export type UploadVerdict = { accepted: true; media: SniffedMedia } | { accepted: false; reason: UploadRejection };

/** Whether the bytes are a file of the requested kind, within the pixel limits for images. */
/** 判断字节内容是否为所请求类型的文件；图片还须在像素上限之内。 */
export function judgeUpload(kind: MediaKind, bytes: Uint8Array): UploadVerdict {
  const media = sniffMedia(bytes);
  if (!media || !ACCEPTED_TYPES[kind].includes(media.contentType)) return { accepted: false, reason: 'unsupported_type' };
  const { width, height } = media;
  if (width !== null && height !== null && (width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE || width * height > MAX_IMAGE_PIXELS)) {
    return { accepted: false, reason: 'image_too_large' };
  }
  return { accepted: true, media };
}
