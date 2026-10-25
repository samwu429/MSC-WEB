import type { HighlightPhoto } from '../../../infrastructure/d1/public/home';
import type { PageContext } from '../../context';
import { MediaImage, SectionHeading, fallbackLang, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { eventHref } from '../../events/EventCard';
import { STATIC_PHOTOS, STATIC_PHOTO_SIZE } from '../static-photos';
import { HOME } from '../strings';

const SHIPPED_HIGHLIGHTS: readonly { src: string; caption: keyof typeof HOME }[] = [
  { src: STATIC_PHOTOS.academicTalk, caption: 'galleryAcademicTalk' },
  { src: STATIC_PHOTOS.reviewSession, caption: 'galleryReviewSession' },
  { src: STATIC_PHOTOS.community, caption: 'galleryCommunity' },
];

/**
 * Recent photos from published events, each linking to its event. Until any are uploaded the section shows the
 * photos that ship with the site, so the home page never has an empty gallery.
 * 已发布活动的最新照片，每张都链接到所属活动。在有照片上传之前，板块显示网站自带的照片，首页因此不会出现空相册。
 */
export function PhotoHighlightsSection({ ctx, photos }: { ctx: PageContext; photos: HighlightPhoto[] }) {
  const { locale } = ctx;
  return (
    <section class="section" aria-labelledby="home-gallery">
      <div class="container">
        <SectionHeading id="home-gallery" eyebrow={t(HOME, 'galleryEyebrow', locale)} title={t(HOME, 'galleryTitle', locale)} />
        <div class="gallery">
          {photos.length > 0
            ? photos.map((photo) => {
                const title = txt(photo.eventTitle, locale);
                return (
                  <figure class="gallery__item" lang={fallbackLang(photo.eventTitle, locale)}>
                    <a href={eventHref({ slug: photo.eventSlug }, ctx)}>
                      <MediaImage mediaKey={photo.mediaKey} alt={title} />
                    </a>
                    <figcaption>{title}</figcaption>
                  </figure>
                );
              })
            : SHIPPED_HIGHLIGHTS.map((photo) => (
                <figure class="gallery__item">
                  <img
                    src={photo.src}
                    alt={t(HOME, photo.caption, locale)}
                    width={STATIC_PHOTO_SIZE.width}
                    height={STATIC_PHOTO_SIZE.height}
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>{t(HOME, photo.caption, locale)}</figcaption>
                </figure>
              ))}
        </div>
      </div>
    </section>
  );
}
