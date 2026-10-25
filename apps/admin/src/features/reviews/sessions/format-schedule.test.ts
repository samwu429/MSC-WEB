import { describe, expect, it } from 'vitest';
import { TIME_TO_BE_ANNOUNCED, formatSchedule } from './format-schedule';

describe('formatSchedule', () => {
  it('says the time is to be announced while no valid start is set', () => {
    expect(formatSchedule(null, null)).toBe(TIME_TO_BE_ANNOUNCED);
    expect(formatSchedule(null, '2026-10-25T20:30')).toBe(TIME_TO_BE_ANNOUNCED);
    expect(formatSchedule('2026-13-01T18:30', null)).toBe(TIME_TO_BE_ANNOUNCED);
  });

  it('shows the full date with weekday and the start time', () => {
    expect(formatSchedule('2026-10-25T18:30', null)).toBe('2026年10月25日 周日 18:30');
  });

  it('shows only the end clock when the session ends on the same day', () => {
    expect(formatSchedule('2026-10-25T18:30', '2026-10-25T20:05')).toBe('2026年10月25日 周日 18:30–20:05');
  });

  it('repeats the date when the session ends on another day, and the year only when it changes', () => {
    expect(formatSchedule('2026-10-25T22:00', '2026-10-26T01:00')).toBe('2026年10月25日 周日 22:00 – 10月26日 周一 01:00');
    expect(formatSchedule('2026-12-31T22:00', '2027-01-01T01:00')).toBe('2026年12月31日 周四 22:00 – 2027年1月1日 周五 01:00');
  });

  it('ignores an end that is not a valid time', () => {
    expect(formatSchedule('2026-10-25T18:30', '2026-10-25T25:00')).toBe('2026年10月25日 周日 18:30');
  });
});
