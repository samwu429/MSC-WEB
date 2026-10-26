import type { Person, SiteEvent, TermKey } from '@msc-web/content';
import type { HomeStats } from '../../infrastructure/d1/public/home';
import type { CourseReviews } from '../../infrastructure/d1/public/reviews';
import type { PageContext } from '../context';
import { AdvisorsPreviewSection } from './sections/AdvisorsPreviewSection';
import { HeroSection } from './sections/HeroSection';
import { JoinBandSection } from './sections/JoinBandSection';
import { MemberAppSection } from './sections/MemberAppSection';
import { PillarsSection } from './sections/PillarsSection';
import { StatsSection } from './sections/StatsSection';
import { TermReviewsSection } from './sections/TermReviewsSection';
import { UpcomingEventsSection } from './sections/UpcomingEventsSection';

export interface HomeData {
  stats: HomeStats;
  upcomingEvents: SiteEvent[];
  term: TermKey;
  termCourses: CourseReviews[];
  advisors: Person[];
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
      <AdvisorsPreviewSection ctx={ctx} advisors={data.advisors} />
      <JoinBandSection ctx={ctx} />
    </>
  );
}
