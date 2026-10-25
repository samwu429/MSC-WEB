import { describe, expect, it } from 'vitest';
import { effectiveEnd, timeStatus } from './schedule';

describe('timeStatus', () => {
  it('moves from upcoming to ongoing to past', () => {
    expect(timeStatus('2026-10-25T18:00', '2026-10-25T20:00', '2026-10-25T17:59')).toBe('upcoming');
    expect(timeStatus('2026-10-25T18:00', '2026-10-25T20:00', '2026-10-25T18:00')).toBe('ongoing');
    expect(timeStatus('2026-10-25T18:00', '2026-10-25T20:00', '2026-10-25T20:00')).toBe('ongoing');
    expect(timeStatus('2026-10-25T18:00', '2026-10-25T20:00', '2026-10-25T20:01')).toBe('past');
  });

  it('ends at the close of the start day when no end is given', () => {
    expect(effectiveEnd('2026-10-25T18:00', null)).toBe('2026-10-25T23:59');
    expect(timeStatus('2026-10-25T18:00', null, '2026-10-25T23:30')).toBe('ongoing');
    expect(timeStatus('2026-10-25T18:00', null, '2026-10-26T00:00')).toBe('past');
  });

  it('is to be announced without a start time', () => {
    expect(timeStatus(null, null, '2026-10-25T12:00')).toBe('tba');
  });
});
