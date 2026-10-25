import { describe, expect, it } from 'vitest';
import { validateDocumentInput } from '@msc-web/content';
import { newDocumentInput } from './document-input';

describe('newDocumentInput', () => {
  it('dates a new document by the Toronto calendar day', () => {
    expect(newDocumentInput(new Date('2026-01-01T03:30:00Z')).publishedOn).toBe('2025-12-31');
    expect(newDocumentInput(new Date('2026-07-01T12:00:00Z')).publishedOn).toBe('2026-07-01');
  });

  it('starts visible, and only the title and the PDF are left for the officer to fill in', () => {
    const input = newDocumentInput(new Date('2026-10-25T16:00:00Z'));
    expect(input.visible).toBe(true);
    const result = validateDocumentInput(input);
    expect(result.ok ? [] : result.issues.map((issue) => issue.field)).toEqual(['title.zh', 'mediaKey']);
  });
});
