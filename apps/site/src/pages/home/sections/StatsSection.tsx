import type { Locale } from '@msc-web/content';
import type { HomeStats } from '../../../infrastructure/d1/public/home';
import { Icon, type IconName } from '../../components/Icon';
import { t } from '../../i18n/strings';
import { HOME } from '../strings';

/**
 * Counts that are still zero are left out, so a new site never boasts "0 events". The fee is always shown because
 * "no membership fee" (Article 3.4) is a promise, not a count.
 * 仍为零的数字不显示，新网站因此不会出现 "0 场活动"。会费始终显示，因为 "不收会费"（第 3.4 条）是一项承诺而不是统计数字。
 */
export function StatsSection({ stats, locale }: { stats: HomeStats; locale: Locale }) {
  const counts: { value: number; label: string; icon: IconName }[] = [
    { value: stats.reviewSessions, label: t(HOME, 'statReviewSessions', locale), icon: 'note' },
    { value: stats.events, label: t(HOME, 'statEvents', locale), icon: 'calendar' },
    { value: stats.coursesWithReviews, label: t(HOME, 'statCourses', locale), icon: 'cap' },
  ];
  const items: { value: string; label: string; icon: IconName }[] = [
    ...counts.filter((item) => item.value > 0).map((item) => ({ ...item, value: String(item.value) })),
    { value: t(HOME, 'statFeeValue', locale), label: t(HOME, 'statFee', locale), icon: 'users' },
  ];
  return (
    <section class="section section--tight" aria-labelledby="home-stats">
      <div class="container">
        <h2 class="stats__title" id="home-stats">
          {t(HOME, 'statsTitle', locale)}
        </h2>
        <div class="stats">
          {items.map((item) => (
            <div class="stat">
              <Icon name={item.icon} class="stat__icon" />
              <div>
                <div class="stat__value">{item.value}</div>
                <div class="stat__label">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
