import { EVENT_LIMITS, type EventPhoto } from '@msc-web/content';
import { errorMessage } from '../../../shared/forms/issues';

/** The validator's upper bound for a photo's sort order. */
/** 校验器允许的照片排序上限。 */
export const MAX_PHOTO_SORT_ORDER = 9999;

/** Gallery order: sort order first, then upload time, the same order visitors see. */
/** 相册顺序：先按排序数字，再按上传时间，与访问者看到的顺序一致。 */
export function sortPhotos(photos: readonly EventPhoto[]): EventPhoto[] {
  return [...photos].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

/** New photos go after the last one already in the gallery. */
/** 新照片排在相册中已有照片的最后。 */
export function nextPhotoSortOrder(photos: readonly Pick<EventPhoto, 'sortOrder'>[]): number {
  if (photos.length === 0) return 0;
  return Math.min(Math.max(...photos.map((photo) => photo.sortOrder)) + 1, MAX_PHOTO_SORT_ORDER);
}

export interface PhotoUploadFailure {
  fileName: string;
  message: string;
}

export interface PhotoUploadReport {
  added: EventPhoto[];
  failed: PhotoUploadFailure[];
}

/**
 * Splits a selection into the files that still fit in the gallery and a report line for each one that does not, so
 * no file is compressed and uploaded only for the server to refuse it. The server's own check stays authoritative.
 * 把所选文件分为相册仍能容纳的文件，以及每个放不下的文件对应的一条报告，因此不会有文件在压缩上传之后才被服务器拒绝。服务器的检查仍以其为准。
 */
export function fitInGallery<F extends { name: string }>(files: readonly F[], photoCount: number): { fitting: F[]; refused: PhotoUploadFailure[] } {
  const room = Math.max(0, EVENT_LIMITS.photos - photoCount);
  return {
    fitting: files.slice(0, room),
    refused: files.slice(room).map((file) => ({ fileName: file.name, message: `相册已满（每个活动最多 ${EVENT_LIMITS.photos} 张），未上传` })),
  };
}

/**
 * Adds files one at a time, in the order chosen. One upload at a time keeps phone connections responsive and the
 * gallery in the chosen order. A failed file is reported and skipped without using a sort order, and the rest
 * continue.
 * 按选择顺序逐个添加文件。一次只上传一个，可以让手机网络保持顺畅，并使相册保持所选的顺序。
 * 失败的文件会被记录并跳过，不占用排序数字，其余文件继续上传。
 */
export async function addPhotosInOrder<F extends { name: string }>(
  files: readonly F[],
  firstSortOrder: number,
  steps: {
    add: (file: F, sortOrder: number) => Promise<EventPhoto>;
    onProgress: (current: number, total: number) => void;
    onAdded: (photo: EventPhoto) => void;
  },
): Promise<PhotoUploadReport> {
  const report: PhotoUploadReport = { added: [], failed: [] };
  let sortOrder = firstSortOrder;
  for (const [index, file] of files.entries()) {
    steps.onProgress(index + 1, files.length);
    try {
      const photo = await steps.add(file, Math.min(sortOrder, MAX_PHOTO_SORT_ORDER));
      report.added.push(photo);
      steps.onAdded(photo);
      sortOrder += 1;
    } catch (error) {
      report.failed.push({ fileName: file.name, message: errorMessage(error) });
    }
  }
  return report;
}
