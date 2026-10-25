import { localeTag, mediaUrl, type Locale, type SiteSettings } from '@msc-web/content';
import type { PageContext } from '../../context';
import { fallbackLang, txt } from '../../components/common';
import { RichText } from '../../components/RichText';
import { COMMON, t } from '../../i18n/strings';
import { SECTION_PATHS, localePath, siteHref } from '../../routing/paths';
import { HOME } from '../strings';
import { STATIC_PHOTOS, STATIC_PHOTO_SIZE } from '../static-photos';

/** The hero photo: the one the editors uploaded, or the photo that ships with the site. */
/** 首页主图：编辑者上传的照片，或网站自带的照片。 */
export function heroPhotoSrc(settings: SiteSettings): string {
  return settings.hero.imageKey ? mediaUrl(settings.hero.imageKey) : STATIC_PHOTOS.academicTalk;
}

/**
 * The first screen: the name in the visitor's language with the other one beneath, the editable tagline and intro,
 * the two main actions and the hero photo. The photo frame crops to 4:3, so fixed width and height attributes
 * reserve its space before the image loads whatever was uploaded.
 * 首屏：访问者语言的名称及下方的另一种语言名称、可编辑的标语与介绍、两个主要操作以及主图。图片框固定裁成 4:3，
 * 因此无论上传的是什么图片，固定的宽高属性都能在图片加载前预留空间。
 */
export function HeroSection({ ctx }: { ctx: PageContext }) {
  const { locale, settings } = ctx;
  const otherLocale: Locale = locale === 'zh' ? 'en' : 'zh';
  const tagline = txt(settings.hero.tagline, locale);
  return (
    <section class="hero" aria-labelledby="home-title">
      <div class="container hero__grid">
        <div>
          <div class="eyebrow hero__eyebrow">{t(COMMON, 'campus', locale)}</div>
          <h1 class="hero__title" id="home-title">
            {t(COMMON, 'siteName', locale)}
          </h1>
          <p class="hero__subtitle" lang={localeTag(otherLocale)}>
            {t(COMMON, 'siteName', otherLocale)}
          </p>
          {tagline && (
            <p class="hero__tagline" lang={fallbackLang(settings.hero.tagline, locale)}>
              {tagline}
            </p>
          )}
          <RichText text={txt(settings.hero.intro, locale)} class="prose hero__intro" lang={fallbackLang(settings.hero.intro, locale)} />
          <div class="btn-row hero__actions">
            <a class="btn btn--gold" href={siteHref(locale, settings.join.url)}>
              {t(COMMON, 'joinUs', locale)}
            </a>
            <a class="btn btn--ghost" href={localePath(locale, SECTION_PATHS.events)}>
              {t(HOME, 'upcomingEvents', locale)}
            </a>
          </div>
        </div>
        <div class="hero__media">
          <img
            class="hero__photo"
            src={heroPhotoSrc(settings)}
            alt={settings.hero.imageKey ? t(HOME, 'heroUploadedPhotoAlt', locale) : t(HOME, 'heroPhotoAlt', locale)}
            width={STATIC_PHOTO_SIZE.width}
            height={STATIC_PHOTO_SIZE.height}
            loading="eager"
            decoding="async"
            fetchpriority="high"
          />
        </div>
      </div>
    </section>
  );
}
