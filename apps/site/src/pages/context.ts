import type { Context } from 'hono';
import { torontoWallTime, type Locale, type SiteSettings, type WallTime } from '@msc-web/content';
import type { Env } from '../env';
import type { AppEnv } from '../http/context';
import { loadSiteSettings } from '../infrastructure/d1/settings';
import { rooted } from './routing/paths';

/**
 * Everything the shared page shell needs and most pages use: the main language (English, with Chinese shown beside
 * it), the page path, site settings for the header and footer, Toronto "now" for upcoming/past, and outbound links.
 * 共用页面外壳所需、且大多数页面都会用到的信息：主要语言（英文，中文附在旁边）、页面路径、页眉页脚所需的网站设置、
 * 用于判断即将开始或已结束的多伦多当前时间，以及站外链接。
 */
/** The language pages are written in; Chinese is shown beside it where a page offers both. */
/** 页面书写使用的语言；页面提供两种语言时，中文显示在旁边。 */
export const SITE_LOCALE: Locale = 'en';

export interface PageContext {
  locale: Locale;
  /** The page path, such as "/events/2026-10-mid-autumn". */
  /** 页面路径，例如 "/events/2026-10-mid-autumn"。 */
  path: string;
  /** The query string with its "?". */
  /** 带 "?" 的查询字符串。 */
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
  const wall = torontoWallTime(now);
  return {
    locale,
    path: rooted(url.pathname),
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
