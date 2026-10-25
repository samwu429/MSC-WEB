import type { PageContext } from '../../context';
import { Icon } from '../../components/Icon';
import { SectionHeading, fallbackLang, txt } from '../../components/common';
import { RichText } from '../../components/RichText';
import { t } from '../../i18n/strings';
import { STATIC_PHOTOS, STATIC_PHOTO_SIZE } from '../../home/static-photos';
import { ABOUT } from '../strings';

/**
 * The editable mission statement beside a community photo, followed by the academic integrity commitment of
 * Article 2.3, which stays fixed whatever the editors write.
 * 可编辑的宗旨与一张社区活动照片并排显示，其后是章程第 2.3 条的学术诚信承诺；无论编辑者写什么，这段承诺都保持不变。
 */
export function MissionSection({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  return (
    <section class="section" aria-labelledby="about-mission">
      <div class="container split">
        <figure class="gallery__item">
          <img
            src={STATIC_PHOTOS.community}
            alt={t(ABOUT, 'missionPhotoAlt', locale)}
            width={STATIC_PHOTO_SIZE.width}
            height={STATIC_PHOTO_SIZE.height}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div>
          <SectionHeading id="about-mission" eyebrow={t(ABOUT, 'missionEyebrow', locale)} title={t(ABOUT, 'missionTitle', locale)} />
          <div class="grid">
            <RichText text={txt(ctx.settings.about.mission, locale)} lang={fallbackLang(ctx.settings.about.mission, locale)} />
            <div class="notice notice--integrity" role="note">
              <Icon name="shield" />
              <div>
                <strong>{t(ABOUT, 'integrityTitle', locale)}</strong>
                <p>{t(ABOUT, 'integrityText', locale)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
