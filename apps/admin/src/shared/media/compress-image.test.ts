import { describe, expect, it } from 'vitest';
import { scaledSize } from './compress-image';

describe('scaledSize', () => {
  it('keeps small images as they are', () => {
    expect(scaledSize(1200, 800)).toEqual({ width: 1200, height: 800 });
  });

  it('fits the long side within the limit and keeps the ratio', () => {
    expect(scaledSize(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(scaledSize(3000, 4000)).toEqual({ width: 1500, height: 2000 });
  });
});
