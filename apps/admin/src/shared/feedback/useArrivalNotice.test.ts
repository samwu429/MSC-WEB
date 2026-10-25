import { beforeEach, describe, expect, it, vi } from 'vitest';
import { noticeOf, useArrivalNotice, withNotice } from './useArrivalNotice';

/**
 * The admin tests run without a DOM, so React and the router are replaced by stand-ins that record what the hook
 * asks for: its first state, and each effect with its dependencies.
 * 后台测试在没有 DOM 的环境中运行，因此用替身代替 React 与路由，记录该 Hook 请求的内容：初始状态，以及每个副作用及其依赖。
 */
const harness = vi.hoisted(() => ({
  location: { pathname: '/', search: '', state: null as unknown },
  navigate: vi.fn(),
  effects: [] as { run: () => void; deps: readonly unknown[] | undefined }[],
}));

vi.mock('react', () => ({
  useState: <T>(initial: T | (() => T)) => [typeof initial === 'function' ? (initial as () => T)() : initial, () => undefined],
  useEffect: (run: () => void, deps?: readonly unknown[]) => {
    harness.effects.push({ run, deps });
  },
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => harness.location,
  useNavigate: () => harness.navigate,
}));

beforeEach(() => {
  harness.navigate.mockReset();
  harness.effects.length = 0;
});

describe('useArrivalNotice', () => {
  it('shows the notice to the component that mounts on the new address and clears it from history once', () => {
    harness.location = { pathname: '/reviews/courses/crs_1', search: '', state: withNotice('课程已创建，现在可以添加复习场次') };
    expect(useArrivalNotice()).toBe('课程已创建，现在可以添加复习场次');
    const [effect] = harness.effects;
    expect(effect?.deps).toEqual([]);
    effect?.run();
    expect(harness.navigate).toHaveBeenCalledWith('/reviews/courses/crs_1', { replace: true, state: null });
  });

  it('leaves a notice that arrives later to the component that mounts for it', () => {
    harness.location = { pathname: '/reviews/courses/new', search: '', state: null };
    expect(useArrivalNotice()).toBeNull();
    const [effect] = harness.effects;
    // No dependencies: the effect runs on mount only, so a later navigation that carries a notice never reaches it.
    // 没有依赖：副作用只在挂载时运行，之后携带确认信息的导航不会触发它。
    expect(effect?.deps).toEqual([]);
    effect?.run();
    expect(harness.navigate).not.toHaveBeenCalled();
  });
});

describe('noticeOf', () => {
  it('reads only a notice made by withNotice', () => {
    expect(noticeOf(withNotice('成员已添加'))).toBe('成员已添加');
    expect(noticeOf(null)).toBeNull();
    expect(noticeOf({ created: true })).toBeNull();
    expect(noticeOf({ notice: 1 })).toBeNull();
  });
});
