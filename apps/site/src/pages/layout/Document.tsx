import { localeTag } from '@msc-web/content';
import type { PageContext } from '../context';
import { COMMON, t } from '../i18n/strings';
import { localePath } from '../routing/paths';
import { STYLESHEET_PATH } from '../styles/stylesheet';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export interface PageMeta {
  /** The page's own title; empty for the home page, which uses the site name alone. */
  /** 页面自身的标题；首页留空，只使用网站名称。 */
  title: string;
  description: string;
  /** A site path or absolute URL of the image for link previews. */
  /** 链接预览图片的本站路径或绝对网址。 */
  image?: string;
  noindex?: boolean;
}

export const DEFAULT_SHARE_IMAGE = '/static/photos/review-session.jpg';

function absolute(origin: string, path: string): string {
  return /^https?:\/\//.test(path) ? path : `${origin}${path}`;
}

/**
 * The full HTML document: head with canonical and alternate-language links and link-preview tags, then header,
 * the page, and footer.
 * 完整的 HTML 文档：head 中包含规范链接、其他语言版本链接与链接预览标签，然后是页眉、页面内容与页脚。
 */
export function Document({ ctx, meta, children }: { ctx: PageContext; meta: PageMeta; children: unknown }) {
  const { locale } = ctx;
  const siteTitle = `UTMMSC ${t(COMMON, 'siteName', locale)}`;
  const title = meta.title ? `${meta.title} · ${siteTitle}` : siteTitle;
  const origin = ctx.links.publicOrigin;
  const canonical = `${origin}${localePath(locale, ctx.path)}`;
  const image = absolute(origin, meta.image ?? DEFAULT_SHARE_IMAGE);
  return (
    <html lang={localeTag(locale)}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#FFFFFF" />
        <title>{title}</title>
        <meta name="description" content={meta.description} />
        {meta.noindex && <meta name="robots" content="noindex" />}
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hreflang="zh-CN" href={`${origin}${localePath('zh', ctx.path)}`} />
        <link rel="alternate" hreflang="en" href={`${origin}${localePath('en', ctx.path)}`} />
        <link rel="alternate" hreflang="x-default" href={`${origin}${localePath('zh', ctx.path)}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteTitle} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={image} />
        <meta property="og:locale" content={locale === 'zh' ? 'zh_CN' : 'en_CA'} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/static/brand/icon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href={STYLESHEET_PATH} />
      </head>
      <body>
        <SiteHeader ctx={ctx} />
        <main id="main">{children}</main>
        <SiteFooter ctx={ctx} />
      </body>
    </html>
  );
}
