import type { Context } from 'hono';
import { DEFAULT_SITE_SETTINGS, type Locale } from '@msc-web/content';
import type { AppEnv } from '../../http/context';
import { buildPageContext, loadPageContext, type PageContext } from '../context';
import { COMMON, t } from '../i18n/strings';
import { renderPage } from '../render';
import { localePath, splitLocalePath } from '../routing/paths';
import { BookMark } from '../components/Icon';

function Message({ ctx, title, text }: { ctx: PageContext; title: string; text: string }) {
  return (
    <section class="section">
      <div class="container">
        <div class="empty">
          <BookMark class="brand__mark" />
          <h1 class="section-title">{title}</h1>
          <p class="section-lead">{text}</p>
          <p>
            <a class="btn btn--primary" href={localePath(ctx.locale, '/')}>
              {t(COMMON, 'backHome', ctx.locale)}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** The 404 page, in the language of the requested path. */
/** 404 页面，使用所请求路径的语言。 */
export async function renderNotFound(c: Context<AppEnv>, locale?: Locale): Promise<Response> {
  const resolved = locale ?? splitLocalePath(new URL(c.req.url).pathname).locale;
  const ctx = await loadPageContext(c, resolved);
  return renderPage(
    c,
    ctx,
    { title: t(COMMON, 'notFoundTitle', resolved), description: t(COMMON, 'notFoundText', resolved), noindex: true },
    <Message ctx={ctx} title={t(COMMON, 'notFoundTitle', resolved)} text={t(COMMON, 'notFoundText', resolved)} />,
    404,
  );
}

/**
 * The 500 page. It must render even when the database is the thing that failed, so it uses the default settings
 * instead of loading them.
 * 500 页面。即使出故障的正是数据库，它也必须能够渲染，因此使用默认设置而不是读取设置。
 */
export async function renderServerError(c: Context<AppEnv>): Promise<Response> {
  const url = new URL(c.req.url);
  const { locale } = splitLocalePath(url.pathname);
  const ctx = buildPageContext(url, c.env, locale, DEFAULT_SITE_SETTINGS, new Date());
  return renderPage(
    c,
    ctx,
    { title: t(COMMON, 'errorTitle', locale), description: t(COMMON, 'errorText', locale), noindex: true },
    <Message ctx={ctx} title={t(COMMON, 'errorTitle', locale)} text={t(COMMON, 'errorText', locale)} />,
    500,
  );
}
