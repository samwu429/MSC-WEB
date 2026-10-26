import { mediaUrl, type SiteSettings } from '@msc-web/content';
import type { PageContext } from '../../context';
import { Bi, BiRichText, BiText } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { SECTION_PATHS, sitePath, siteHref } from '../../routing/paths';
import { HOME } from '../strings';
import { STATIC_PHOTOS, STATIC_PHOTO_SIZE } from '../static-photos';

/** The hero photo: the one the editors uploaded, or the photo that ships with the site. */
/** 首页主图：编辑者上传的照片，或网站自带的照片。 */
export function heroPhotoSrc(settings: SiteSettings): string {
  return settings.hero.imageKey ? mediaUrl(settings.hero.imageKey) : STATIC_PHOTOS.academicTalk;
}

/**
 * The first screen: the hero photo across the full width with the English name over it, the Chinese name beneath,
 * the editable tagline in both languages and the two main actions; then the editable intro in a band of its own. The
 * photo is cropped to the banner by CSS, and its width and height attributes keep the aspect ratio known before it
 * loads whatever was uploaded.
 * 首屏：主图横跨整个页面宽度，其上叠加英文名称、下方的中文名称、两种语言的可编辑标语和两个主要操作；
 * 随后是单独一条色带中的可编辑介绍。图片由 CSS 裁成横幅，宽高属性让浏览器在图片加载前就知道其比例，无论上传的是什么图片。
 */
export function HeroSection({ ctx }: { ctx: PageContext }) {
  const { locale, settings } = ctx;
  return (
    <>
      <section class="hero" aria-labelledby="home-title">
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
        <div class="container hero__content">
          <div class="eyebrow hero__eyebrow">
            <Bi text={COMMON.campus} />
          </div>
          <h1 class="hero__title" id="home-title">
            {t(COMMON, 'siteName', locale)}
          </h1>
          <p class="hero__subtitle" lang="zh-CN">
            {COMMON.siteName.zh}
          </p>
          <BiText text={settings.hero.tagline} class="hero__tagline" />
          <div class="btn-row hero__actions">
            <a class="btn btn--gold" href={siteHref(settings.join.url)}>
              {t(COMMON, 'joinUs', locale)}
            </a>
            <a class="btn btn--light" href={sitePath(SECTION_PATHS.events)}>
              {t(HOME, 'upcomingEvents', locale)}
            </a>
          </div>
        </div>
      </section>
      {(settings.hero.intro.en || settings.hero.intro.zh) && (
        <div class="intro-band">
          <div class="container intro-band__inner">
            <span class="intro-band__mark" aria-hidden="true">
              “
            </span>
            <div>
              <BiRichText text={settings.hero.intro} class="prose hero__intro" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
