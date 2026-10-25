import type { SiteEvent, TermKey } from '@msc-web/content';
import type { HighlightPhoto, HomeStats } from '../../infrastructure/d1/public/home';
import type { CourseReviews } from '../../infrastructure/d1/public/reviews';
import type { PageContext } from '../context';
import type { PeopleRoster } from '../people/roster';
import { HeroSection } from './sections/HeroSection';
import { JoinBandSection } from './sections/JoinBandSection';
import { MemberAppSection } from './sections/MemberAppSection';
import { PhotoHighlightsSection } from './sections/PhotoHighlightsSection';
import { PillarsSection } from './sections/PillarsSection';
import { PresidiumPreviewSection } from './sections/PresidiumPreviewSection';
import { StatsSection } from './sections/StatsSection';
import { TermReviewsSection } from './sections/TermReviewsSection';
import { UpcomingEventsSection } from './sections/UpcomingEventsSection';

export interface HomeData {
  stats: HomeStats;
  upcomingEvents: SiteEvent[];
  term: TermKey;
  termCourses: CourseReviews[];
  presidium: PeopleRoster['presidium'];
  photos: HighlightPhoto[];
}

export function HomePage({ ctx, data }: { ctx: PageContext; data: HomeData }) {
  return (
    <>
      <HeroSection ctx={ctx} />
      <StatsSection stats={data.stats} locale={ctx.locale} />
      <MemberAppSection ctx={ctx} />
      <PillarsSection ctx={ctx} />
      <UpcomingEventsSection ctx={ctx} events={data.upcomingEvents} />
      <TermReviewsSection ctx={ctx} term={data.term} courses={data.termCourses} />
      <PresidiumPreviewSection ctx={ctx} presidium={data.presidium} />
      <PhotoHighlightsSection ctx={ctx} photos={data.photos} />
      <JoinBandSection ctx={ctx} />
    </>
  );
}
