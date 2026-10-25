/**
 * Photos from phones are often 5-10 MB. Before upload they are scaled so the long side is at most MAX_EDGE and
 * re-encoded as JPEG, which also drops camera metadata such as GPS location. PNG files (QR codes, posters with
 * text) keep their format, because JPEG blurs sharp edges; they are only scaled when too large.
 * 手机照片通常有 5-10 MB。上传前会把长边缩放到不超过 MAX_EDGE 并重新编码为 JPEG，同时去除 GPS 位置等相机元数据。
 * PNG 文件（二维码、带文字的海报）保持原格式，因为 JPEG 会让锐利边缘变模糊；只有过大时才会缩放。
 */

export const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.85;

export function scaledSize(width: number, height: number, maxEdge: number = MAX_EDGE): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const ratio = maxEdge / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('图片处理失败，请换一张图片'))), type, quality);
  });
}

/** The file ready to upload, with its new name. */
/** 可以上传的文件及其新文件名。 */
export async function prepareImage(file: File): Promise<{ blob: Blob; name: string }> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error('请选择 JPG、PNG 或 WebP 格式的图片');
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('无法读取这张图片。iPhone 的 HEIC 照片请先在相册中导出为 JPG');
  }
  const keepPng = file.type === 'image/png';
  const size = scaledSize(bitmap.width, bitmap.height);
  if (keepPng && size.width === bitmap.width) {
    bitmap.close();
    return { blob: file, name: file.name };
  }
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('浏览器无法处理图片');
  if (!keepPng) {
    // JPEG has no transparency; paint white first so transparent areas do not turn black.
    // JPEG 不支持透明；先铺白色底，避免透明区域变黑。
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size.width, size.height);
  }
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const type = keepPng ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, type, keepPng ? undefined : JPEG_QUALITY);
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return { blob, name: `${base}.${keepPng ? 'png' : 'jpg'}` };
}
