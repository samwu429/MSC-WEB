import { describe, expect, it } from 'vitest';
import { dateBadge, formatClock, formatDate, formatLongDate, formatTimeRange } from './format';

describe('formatDate', () => {
  it('shows month, day and weekday', () => {
    expect(formatDate('2026-10-25', 'zh')).toBe('10月25日 周日');
    expect(formatDate('2026-10-25', 'en')).toBe('Sun, Oct 25');
  });

  it('adds the year only when it is not the current one', () => {
    expect(formatDate('2026-10-25', 'zh', 2026)).toBe('10月25日 周日');
    expect(formatDate('2027-01-01', 'zh', 2026)).toBe('2027年1月1日 周五');
    expect(formatDate('2027-01-01', 'en', 2026)).toBe('Fri, Jan 1, 2027');
  });
});

describe('formatClock', () => {
  it('uses the 24-hour clock in Chinese and AM/PM in English', () => {
    expect(formatClock('2026-10-25T18:30', 'zh')).toBe('18:30');
    expect(formatClock('2026-10-25T09:05', 'zh')).toBe('09:05');
    expect(formatClock('2026-10-25T18:30', 'en')).toBe('6:30 PM');
    expect(formatClock('2026-10-25T00:05', 'en')).toBe('12:05 AM');
    expect(formatClock('2026-10-25T12:00', 'en')).toBe('12:00 PM');
  });
});

describe('formatTimeRange', () => {
  it('shows the start alone without an end', () => {
    expect(formatTimeRange('2026-10-25T18:30', null, 'zh')).toBe('10月25日 周日 18:30');
  });

  it('joins a same-day end to the start clock', () => {
    expect(formatTimeRange('2026-10-25T18:30', '2026-10-25T20:05', 'zh')).toBe('10月25日 周日 18:30–20:05');
    expect(formatTimeRange('2026-10-25T18:30', '2026-10-25T20:05', 'en')).toBe('Sun, Oct 25 6:30 PM–8:05 PM');
  });

  it('shows both dates when the end is on another day', () => {
    expect(formatTimeRange('2026-12-31T22:00', '2027-01-01T01:00', 'zh', 2026)).toBe('12月31日 周四 22:00 – 2027年1月1日 周五 01:00');
    expect(formatTimeRange('2026-12-31T22:00', '2027-01-01T01:00', 'en', 2026)).toBe('Thu, Dec 31 10:00 PM – Fri, Jan 1, 2027 1:00 AM');
  });
});

describe('dateBadge', () => {
  it('splits a date into month and day', () => {
    expect(dateBadge('2026-10-05', 'zh')).toEqual({ month: '10月', day: '5' });
    expect(dateBadge('2026-10-05', 'en')).toEqual({ month: 'OCT', day: '5' });
  });
});

describe('formatLongDate', () => {
  it('writes the full date with the year', () => {
    expect(formatLongDate('2026-09-01', 'zh')).toBe('2026年9月1日');
    expect(formatLongDate('2026-10-25', 'en')).toBe('October 25, 2026');
  });
});
