import { describe, expect, it } from 'vitest';
import { EVENT_LIMITS, type EventPhoto } from '@msc-web/content';
import { ApiError } from '../../../shared/api/client';
import { MAX_PHOTO_SORT_ORDER, addPhotosInOrder, fitInGallery, nextPhotoSortOrder, sortPhotos } from './photo-upload';

function photo(id: string, sortOrder: number, createdAt = '2026-10-26T00:00:00.000Z'): EventPhoto {
  return { id, eventId: 'evt_1', mediaKey: `img/2026/${'0'.repeat(31)}${id.slice(-1)}.jpg`, caption: { zh: '', en: '' }, sortOrder, createdAt };
}

describe('sortPhotos', () => {
  it('orders by sort order, then by upload time', () => {
    const photos = [photo('p3', 2), photo('p2', 1, '2026-10-26T00:00:02.000Z'), photo('p1', 1, '2026-10-26T00:00:01.000Z')];
    expect(sortPhotos(photos).map((item) => item.id)).toEqual(['p1', 'p2', 'p3']);
  });
});

describe('nextPhotoSortOrder', () => {
  it('starts an empty gallery at zero', () => {
    expect(nextPhotoSortOrder([])).toBe(0);
  });

  it('follows the largest sort order, whatever the list order', () => {
    expect(nextPhotoSortOrder([{ sortOrder: 7 }, { sortOrder: 2 }])).toBe(8);
  });

  it('never goes past the largest value the server accepts', () => {
    expect(nextPhotoSortOrder([{ sortOrder: MAX_PHOTO_SORT_ORDER }])).toBe(MAX_PHOTO_SORT_ORDER);
  });
});

describe('fitInGallery', () => {
  const files = Array.from({ length: 20 }, (_, index) => ({ name: `IMG_${index + 1}.jpg` }));

  it('uploads only the files that still fit and reports the rest without uploading them', () => {
    const { fitting, refused } = fitInGallery(files, EVENT_LIMITS.photos - 5);
    expect(fitting.map((file) => file.name)).toEqual(['IMG_1.jpg', 'IMG_2.jpg', 'IMG_3.jpg', 'IMG_4.jpg', 'IMG_5.jpg']);
    expect(refused).toHaveLength(15);
    expect(refused[0]).toEqual({ fileName: 'IMG_6.jpg', message: `相册已满（每个活动最多 ${EVENT_LIMITS.photos} 张），未上传` });
  });

  it('refuses every file once the gallery is full and keeps a selection that fits', () => {
    expect(fitInGallery(files, EVENT_LIMITS.photos).fitting).toEqual([]);
    expect(fitInGallery(files, EVENT_LIMITS.photos + 3).refused).toHaveLength(20);
    expect(fitInGallery(files, 0)).toEqual({ fitting: files, refused: [] });
  });
});

describe('addPhotosInOrder', () => {
  const files = [{ name: 'a.jpg' }, { name: 'broken.heic' }, { name: 'c.jpg' }];

  it('adds files one by one, continues past a failure and reports it', async () => {
    const calls: string[] = [];
    const progress: string[] = [];
    const shown: string[] = [];
    let running = 0;

    const report = await addPhotosInOrder(files, 5, {
      add: async (file, sortOrder) => {
        running += 1;
        expect(running).toBe(1);
        calls.push(`${file.name}@${sortOrder}`);
        await Promise.resolve();
        running -= 1;
        if (file.name === 'broken.heic') throw new ApiError(400, 'invalid_media', '无法识别这张图片');
        return photo(`p${calls.length}`, sortOrder);
      },
      onProgress: (current, total) => progress.push(`${current}/${total}`),
      onAdded: (added) => shown.push(added.id),
    });

    expect(progress).toEqual(['1/3', '2/3', '3/3']);
    expect(calls).toEqual(['a.jpg@5', 'broken.heic@6', 'c.jpg@6']);
    expect(shown).toEqual(['p1', 'p3']);
    expect(report.added.map((item) => item.sortOrder)).toEqual([5, 6]);
    expect(report.failed).toEqual([{ fileName: 'broken.heic', message: '无法识别这张图片' }]);
  });

  it('reports every file when all of them fail', async () => {
    const report = await addPhotosInOrder(files, 0, {
      add: () => Promise.reject(new Error('网络连接失败')),
      onProgress: () => undefined,
      onAdded: () => undefined,
    });
    expect(report.added).toEqual([]);
    expect(report.failed.map((failure) => failure.fileName)).toEqual(['a.jpg', 'broken.heic', 'c.jpg']);
  });
});
