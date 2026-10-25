import { describe, expect, it } from 'vitest';
import { MAX_FILE_NAME_LENGTH, sanitizeFileName } from './file-name';

describe('sanitizeFileName', () => {
  it('keeps an ordinary name as it was', () => {
    expect(sanitizeFileName('2026 年度公开账目.pdf', 'application/pdf')).toBe('2026 年度公开账目.pdf');
  });

  it('keeps only the last segment of a Windows or Unix path', () => {
    expect(sanitizeFileName('C:\\Users\\me\\Desktop\\poster.png', 'image/png')).toBe('poster.png');
    expect(sanitizeFileName('../../etc/passwd', 'application/pdf')).toBe('passwd');
  });

  it('drops control characters, bidirectional overrides and quotes, and collapses whitespace', () => {
    expect(sanitizeFileName('a\u0000b\u202Egnp.exe', 'image/png')).toBe('abgnp.exe');
    expect(sanitizeFileName('"report" \'final\' `v2`.pdf', 'application/pdf')).toBe('report final v2.pdf');
    expect(sanitizeFileName('  meeting\t\tnotes \n 2026.pdf  ', 'application/pdf')).toBe('meeting notes 2026.pdf');
  });

  it('falls back to a default name with the stored extension when nothing is left', () => {
    expect(sanitizeFileName(undefined, 'image/jpeg')).toBe('image.jpg');
    expect(sanitizeFileName('', 'image/webp')).toBe('image.webp');
    expect(sanitizeFileName('folder/', 'application/pdf')).toBe('document.pdf');
    expect(sanitizeFileName('..', 'application/pdf')).toBe('document.pdf');
    expect(sanitizeFileName('"\u0007"', 'image/png')).toBe('image.png');
  });

  it('shortens long names to the limit in whole characters and keeps the extension', () => {
    const name = sanitizeFileName(`${'会议记录'.repeat(50)}.pdf`, 'application/pdf');
    expect(Array.from(name)).toHaveLength(MAX_FILE_NAME_LENGTH);
    expect(name.endsWith('.pdf')).toBe(true);
    const supplementary = sanitizeFileName('\u{20BB7}'.repeat(200), 'image/png');
    expect(Array.from(supplementary)).toHaveLength(MAX_FILE_NAME_LENGTH);
    expect(supplementary).not.toMatch(/[\uD800-\uDBFF]$/);
  });
});
