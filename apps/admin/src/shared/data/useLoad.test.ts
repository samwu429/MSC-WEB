import { describe, expect, it } from 'vitest';
import { currentLoadState, type LoadState } from './useLoad';

const READY: LoadState<string | null> = { status: 'ready', data: null };

describe('currentLoadState', () => {
  it('shows the result loaded for the current parameters', () => {
    expect(currentLoadState(READY, ['per_1', undefined], ['per_1', undefined])).toBe(READY);
  });

  it('reads as loading on the render where the address changes, before the new load starts', () => {
    // /people/new has just navigated to /people/per_1: the empty "new" result must not mount another form.
    // /people/new 刚导航到 /people/per_1：空的 "新建" 结果不能再挂载一张表单。
    expect(currentLoadState(READY, [undefined], ['per_1'])).toEqual({ status: 'loading' });
    expect(currentLoadState(READY, ['academic'], ['academic', 'draft'])).toEqual({ status: 'loading' });
  });
});
