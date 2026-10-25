import type { ComponentProps } from 'react';
import { PUBLISH_STATUS_LABELS, type ExamKind, type PublishStatus } from '@msc-web/content';
import { Badge } from '../../../shared/ui/feedback';

type BadgeTone = NonNullable<ComponentProps<typeof Badge>['tone']>;

const EXAM_BADGES: Record<ExamKind, { label: string; tone: BadgeTone }> = {
  midterm: { label: '期中', tone: 'purple' },
  final: { label: '期末', tone: 'gold' },
};

export function ExamBadge({ exam }: { exam: ExamKind }) {
  const badge = EXAM_BADGES[exam];
  return <Badge tone={badge.tone}>{badge.label}</Badge>;
}

export function StatusBadge({ status }: { status: PublishStatus }) {
  return <Badge tone={status === 'published' ? 'green' : 'gray'}>{PUBLISH_STATUS_LABELS[status].zh}</Badge>;
}
