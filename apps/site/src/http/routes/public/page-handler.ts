import type { Context } from 'hono';
import type { Locale } from '@msc-web/content';
import type { AppEnv } from '../../context';

/**
 * A public page: loads its data and renders it in one language. Every page is registered twice, at /path for
 * Chinese and /en/path for English, so a handler never parses the language from the URL itself.
 * 一个公开页面：加载数据并以一种语言渲染。每个页面都注册两次，中文为 /path，英文为 /en/path，因此处理函数无需自行从网址解析语言。
 */
export type PageHandler = (c: Context<AppEnv>, locale: Locale) => Promise<Response>;
