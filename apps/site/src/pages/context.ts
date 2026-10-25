import type { Context } from 'hono';
import { torontoWallTime, type Locale, type SiteSettings, type WallTime } from '@msc-web/content';
import type { Env } from '../env';
import type { AppEnv } from '../http/context';
import { loadSiteSettings } from '../infrastructure/d1/settings';
import { splitLocalePath } from './routing/paths';

/**
 * Everything the shared page shell needs and most pages use: language, the locale-neutral path for the language
 * switch, site settings for the header and footer, Toronto "now" for upcoming/past, and outbound links.
 * 共用页面外壳所需、且大多数页面都会用到的信息：语言、供语言切换使用的与语言无关的路径、页眉页脚所需的网站设置、
 * 用于判断即将开始或已结束的多伦多当前时间，以及站外链接。
 */
export interface PageContext {
  locale: Locale;
  /** Locale-neutral path, such as "/events/2026-10-mid-autumn". */
  /** 与语言无关的路径，例如 "/events/2026-10-mid-autumn"。 */
  path: string;
  /** The query string with its "?", kept when switching language. */
  /** 带 "?" 的查询字符串，切换语言时保留。 */
  search: string;
  settings: SiteSettings;
  now: WallTime;
  currentYear: number;
  links: {
    memberApp: string;
    android: string;
    publicOrigin: string;
  };
}

/**
 * The page context for a request URL from settings already in hand. The 500 page calls it with the default
 * settings, so it matches every other page without touching the database.
 * 根据请求网址与已取得的设置构建页面上下文。500 页面以默认设置调用它，因此无需访问数据库也与其他页面一致。
 */
export function buildPageContext(
  url: URL,
  env: Pick<Env, 'MEMBER_APP_URL' | 'ANDROID_DOWNLOAD_URL' | 'PUBLIC_ORIGIN'>,
  locale: Locale,
  settings: SiteSettings,
  now: Date,
): PageContext {
  const { path } = splitLocalePath(url.pathname);
  const wall = torontoWallTime(now);
  return {
    locale,
    path,
    search: url.search,
    settings,
    now: wall,
    currentYear: Number(wall.slice(0, 4)),
    links: {
      memberApp: env.MEMBER_APP_URL,
      android: env.ANDROID_DOWNLOAD_URL,
      publicOrigin: env.PUBLIC_ORIGIN.replace(/\/+$/, ''),
    },
  };
}

export async function loadPageContext(c: Context<AppEnv>, locale: Locale, now: Date = new Date()): Promise<PageContext> {
  const { settings } = await loadSiteSettings(c.env.DB);
  return buildPageContext(new URL(c.req.url), c.env, locale, settings, now);
}
