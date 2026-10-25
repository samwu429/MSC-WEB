import { termOfDate, torontoWallTime, wallDateOf } from '@msc-web/content';
import { listUpcomingEvents } from '../../../../infrastructure/d1/public/events';
import { countHomeStats, listHighlightPhotos } from '../../../../infrastructure/d1/public/home';
import { listVisiblePeople } from '../../../../infrastructure/d1/public/people';
import { listTermCourseReviews } from '../../../../infrastructure/d1/public/reviews';
import { txt } from '../../../../pages/components/common';
import { loadPageContext } from '../../../../pages/context';
import { HomePage } from '../../../../pages/home/HomePage';
import { heroPhotoSrc } from '../../../../pages/home/sections/HeroSection';
import { buildRoster } from '../../../../pages/people/roster';
import { renderPage } from '../../../../pages/render';
import type { PageHandler } from '../page-handler';

const UPCOMING_EVENT_LIMIT = 3;
const TERM_COURSE_LIMIT = 4;
const HIGHLIGHT_PHOTO_LIMIT = 6;

/**
 * The home page. One instant drives both the page context and the queries, so "upcoming" and "this term" agree with
 * the status the cards show; the queries run side by side with the context load.
 * 首页。页面上下文与各查询使用同一时刻，因此 "即将开始" 与 "本学期" 与卡片显示的状态一致；各查询与上下文加载并行执行。
 */
export const homePage: PageHandler = async (c, locale) => {
  const db = c.env.DB;
  const now = new Date();
  const wallNow = torontoWallTime(now);
  const term = termOfDate(wallDateOf(wallNow));
  const [ctx, stats, upcomingEvents, termCourses, presidium, photos] = await Promise.all([
    loadPageContext(c, locale, now),
    countHomeStats(db),
    listUpcomingEvents(db, wallNow, { limit: UPCOMING_EVENT_LIMIT }),
    listTermCourseReviews(db, term),
    listVisiblePeople(db, 'presidium'),
    listHighlightPhotos(db, HIGHLIGHT_PHOTO_LIMIT),
  ]);
  return renderPage(
    c,
    ctx,
    { title: '', description: txt(ctx.settings.hero.intro, locale).replace(/\s+/g, ' ').trim(), image: heroPhotoSrc(ctx.settings) },
    <HomePage
      ctx={ctx}
      data={{
        stats,
        upcomingEvents,
        term,
        termCourses: termCourses.slice(0, TERM_COURSE_LIMIT),
        presidium: buildRoster(presidium).presidium,
        photos,
      }}
    />,
  );
};
