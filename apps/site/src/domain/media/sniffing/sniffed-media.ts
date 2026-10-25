import type { MediaContentType } from '@msc-web/content';

/** What the bytes of an upload turned out to be. Images carry their pixel size; documents have none. */
/** 根据上传字节识别出的文件类型。图片带有像素尺寸；文档没有尺寸。 */
export interface SniffedMedia {
  contentType: MediaContentType;
  width: number | null;
  height: number | null;
}
