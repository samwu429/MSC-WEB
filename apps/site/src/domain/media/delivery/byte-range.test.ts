import { describe, expect, it } from 'vitest';
import { parseByteRange } from './byte-range';

describe('parseByteRange', () => {
  it('reads a closed range and clamps its end to the file', () => {
    expect(parseByteRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 });
    expect(parseByteRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 });
    expect(parseByteRange('bytes=0-99999999999999999999999', 1000)).toEqual({ start: 0, end: 999 });
  });

  it('reads an open range to the end of the file', () => {
    expect(parseByteRange('bytes=500-', 1000)).toEqual({ start: 500, end: 999 });
  });

  it('reads a suffix range as the last bytes of the file', () => {
    expect(parseByteRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 });
    expect(parseByteRange('bytes=-5000', 1000)).toEqual({ start: 0, end: 999 });
  });

  it('accepts the unit in any case', () => {
    expect(parseByteRange('Bytes=1-2', 10)).toEqual({ start: 1, end: 2 });
  });

  it('reports ranges that start past the end as unsatisfiable', () => {
    expect(parseByteRange('bytes=1000-', 1000)).toBe('unsatisfiable');
    expect(parseByteRange('bytes=2000-3000', 1000)).toBe('unsatisfiable');
    expect(parseByteRange('bytes=-0', 1000)).toBe('unsatisfiable');
    expect(parseByteRange('bytes=-10', 0)).toBe('unsatisfiable');
  });

  it('ignores headers it does not serve, so the whole file is sent', () => {
    for (const header of [undefined, null, '', 'bytes=', 'bytes=-', 'items=0-1', 'bytes=0-1,5-6', 'bytes=5-1', 'bytes=a-b', 'bytes=-1-2']) {
      expect(parseByteRange(header, 1000), String(header)).toBeNull();
    }
  });
});
