import type { Locale } from '@msc-web/content';
import type { HomeStats } from '../../../infrastructure/d1/public/home';
import { t } from '../../i18n/strings';
import { HOME } from '../strings';

/**
 * Counts that are still zero are left out, so a new site never boasts "0 events". The fee is always shown because
 * "no membership fee" (Article 3.4) is a promise, not a count.
 * 仍为零的数字不显示，新网站因此不会出现 "0 场活动"。会费始终显示，因为 "不收会费"（第 3.4 条）是一项承诺而不是统计数字。
 */
export function StatsSection({ stats, locale }: { stats: HomeStats; locale: Locale }) {
  const counts = [
    { value: stats.reviewSessions, label: t(HOME, 'statReviewSessions', locale) },
    { value: stats.events, label: t(HOME, 'statEvents', locale) },
    { value: stats.coursesWithReviews, label: t(HOME, 'statCourses', locale) },
  ];
  const items = [
    ...counts.filter((item) => item.value > 0).map((item) => ({ value: String(item.value), label: item.label })),
    { value: t(HOME, 'statFeeValue', locale), label: t(HOME, 'statFee', locale) },
  ];
  return (
    <section class="section section--tight" aria-labelledby="home-stats">
      <div class="container">
        <h2 class="sr-only" id="home-stats">
          {t(HOME, 'statsTitle', locale)}
        </h2>
        <div class="stats">
          {items.map((item) => (
            <div class="stat">
              <div class="stat__value">{item.value}</div>
              <div class="stat__label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
