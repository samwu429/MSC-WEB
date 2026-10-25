/** Photos that ship with the site in apps/site/static/photos, used until editors upload their own. */
/** 网站自带的照片（位于 apps/site/static/photos），在编辑者上传自己的照片之前使用。 */
export const STATIC_PHOTOS = {
  academicTalk: '/static/photos/academic-talk.jpg',
  reviewSession: '/static/photos/review-session.jpg',
  community: '/static/photos/community.jpg',
} as const;

/** Every shipped photo is 1600 x 1200 (4:3), the same ratio as the hero and gallery frames. */
/** 每张自带照片均为 1600 x 1200（4:3），与主图框和相册框的比例相同。 */
export const STATIC_PHOTO_SIZE = { width: 1600, height: 1200 } as const;
