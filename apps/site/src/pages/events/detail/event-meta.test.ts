import { describe, expect, it } from 'vitest';
import { DESCRIPTION_LENGTH, eventDescription, excerpt } from './event-meta';

describe('excerpt', () => {
  it('joins lines and keeps short text whole', () => {
    expect(excerpt('  First line\n\nsecond   line ', 50)).toBe('First line second line');
  });

  it('cuts long text at whole characters and adds an ellipsis', () => {
    const cut = excerpt('中秋'.repeat(100), 9);
    expect(cut).toBe('中秋中秋中秋中秋…');
    expect(Array.from(cut)).toHaveLength(9);
  });
});

describe('eventDescription', () => {
  const empty = { zh: '', en: '' };

  it('prefers the summary in the visitor language', () => {
    expect(eventDescription({ summary: { zh: '中秋晚会', en: 'Mid-Autumn night' }, body: { zh: '正文', en: 'Body' } }, 'en')).toBe('Mid-Autumn night');
  });

  it('uses the opening of the body when there is no summary', () => {
    const body = { zh: '长'.repeat(200), en: '' };
    const description = eventDescription({ summary: empty, body }, 'en');
    expect(Array.from(description)).toHaveLength(DESCRIPTION_LENGTH);
    expect(description.endsWith('…')).toBe(true);
  });

  it('falls back to the events introduction when the event has no text', () => {
    expect(eventDescription({ summary: empty, body: empty }, 'zh')).toContain('活动');
  });
});
