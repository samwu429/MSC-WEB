import type { Context } from 'hono';
import { DEFAULT_SITE_SETTINGS } from '@msc-web/content';
import type { AppEnv } from '../../http/context';
import { SITE_LOCALE, buildPageContext, loadPageContext, type PageContext } from '../context';
import { Bi, BiText, type Copy } from '../components/common';
import { COMMON, t } from '../i18n/strings';
import { renderPage } from '../render';
import { sitePath } from '../routing/paths';
import { BookMark } from '../components/Icon';

function Message({ ctx, title, text }: { ctx: PageContext; title: Copy; text: Copy }) {
  return (
    <section class="section">
      <div class="container">
        <div class="empty">
          <BookMark class="brand__mark" />
          <h1 class="section-title">
            <Bi text={title} />
          </h1>
          <BiText text={text} class="section-lead" />
          <p>
            <a class="btn btn--primary" href={sitePath('/')}>
              {t(COMMON, 'backHome', ctx.locale)}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** The 404 page. */
/** 404 页面。 */
export async function renderNotFound(c: Context<AppEnv>): Promise<Response> {
  const ctx = await loadPageContext(c, SITE_LOCALE);
  return renderPage(
    c,
    ctx,
    { title: t(COMMON, 'notFoundTitle', SITE_LOCALE), description: t(COMMON, 'notFoundText', SITE_LOCALE), noindex: true },
    <Message ctx={ctx} title={COMMON.notFoundTitle} text={COMMON.notFoundText} />,
    404,
  );
}

/**
 * The 500 page. It must render even when the database is the thing that failed, so it uses the default settings
 * instead of loading them.
 * 500 页面。即使出故障的正是数据库，它也必须能够渲染，因此使用默认设置而不是读取设置。
 */
export async function renderServerError(c: Context<AppEnv>): Promise<Response> {
  const ctx = buildPageContext(new URL(c.req.url), c.env, SITE_LOCALE, DEFAULT_SITE_SETTINGS, new Date());
  return renderPage(
    c,
    ctx,
    { title: t(COMMON, 'errorTitle', SITE_LOCALE), description: t(COMMON, 'errorText', SITE_LOCALE), noindex: true },
    <Message ctx={ctx} title={COMMON.errorTitle} text={COMMON.errorText} />,
    500,
  );
}
