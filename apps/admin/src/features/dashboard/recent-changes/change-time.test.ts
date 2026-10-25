import { describe, expect, it } from 'vitest';
import { formatChangeTime } from './change-time';

describe('formatChangeTime', () => {
  const noonInToronto = new Date('2026-10-25T16:00:00Z');

  it('names today and yesterday by the Toronto calendar, not the UTC one', () => {
    expect(formatChangeTime('2026-10-25T13:05:00Z', noonInToronto)).toBe('今天 09:05');
    expect(formatChangeTime('2026-10-25T02:30:00Z', noonInToronto)).toBe('昨天 22:30');
  });

  it('shows month and day within the current year, using standard time in winter', () => {
    expect(formatChangeTime('2026-03-01T15:00:00Z', noonInToronto)).toBe('3月1日 10:00');
  });

  it('adds the year for an earlier year', () => {
    expect(formatChangeTime('2025-06-30T23:30:00Z', noonInToronto)).toBe('2025年6月30日 19:30');
  });

  it('treats the last day of the previous year as yesterday on the first of January', () => {
    expect(formatChangeTime('2026-01-01T04:59:00Z', new Date('2026-01-01T15:00:00Z'))).toBe('昨天 23:59');
  });

  it('shows a value that is not a timestamp unchanged', () => {
    expect(formatChangeTime('not a time', noonInToronto)).toBe('not a time');
  });
});
