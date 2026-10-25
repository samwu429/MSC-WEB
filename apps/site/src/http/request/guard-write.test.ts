import { describe, expect, it } from 'vitest';
import { HttpError, conflict } from '../errors';
import { guardWrite } from './guard-write';

const UNIQUE = new Error('D1_ERROR: UNIQUE constraint failed: events.slug: SQLITE_CONSTRAINT');
const FOREIGN_KEY = new Error('D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT');

function failing(error: Error): () => Promise<never> {
  return async () => {
    throw error;
  };
}

describe('guardWrite', () => {
  it('returns what the write returns', async () => {
    expect(await guardWrite(async () => 'saved', { mediaField: 'photoKey' })).toBe('saved');
  });

  it('answers a UNIQUE failure with the given error', async () => {
    const taken = conflict('office_taken', '该职位刚刚已由其他成员担任，请刷新页面后再保存');
    await expect(guardWrite(failing(UNIQUE), { unique: () => taken })).rejects.toBe(taken);
  });

  it('reports a FOREIGN KEY failure on the media field', async () => {
    const error = await guardWrite(failing(FOREIGN_KEY), { mediaField: 'coverKey' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 400, code: 'invalid', issues: [{ field: 'coverKey', message: '文件不存在，请重新上传' }] });
  });

  it('passes on failures it has no answer for', async () => {
    await expect(guardWrite(failing(UNIQUE), { mediaField: 'mediaKey' })).rejects.toBe(UNIQUE);
    await expect(guardWrite(failing(FOREIGN_KEY), { unique: () => conflict('x', 'y') })).rejects.toBe(FOREIGN_KEY);
    const other = new Error('D1_ERROR: network connection lost');
    await expect(guardWrite(failing(other), { unique: () => conflict('x', 'y'), mediaField: 'mediaKey' })).rejects.toBe(other);
  });
});
