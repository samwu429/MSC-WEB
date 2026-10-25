import { useCallback, useEffect, useRef, useState } from 'react';

export type LoadState<T> = { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready'; data: T };

const LOADING = { status: 'loading' } as const;

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
}

/**
 * The state a screen may show: a result loaded for other parameters reads as loading, so a screen opened for a new
 * address never renders, or mounts forms for, the record of the previous one.
 * 页面可以显示的状态：为其他参数加载的结果视为加载中，因此为新地址打开的页面永远不会显示上一个地址的记录，也不会为其挂载表单。
 */
export function currentLoadState<T>(state: LoadState<T>, loadedFor: readonly unknown[], deps: readonly unknown[]): LoadState<T> {
  return sameDeps(loadedFor, deps) ? state : LOADING;
}

/**
 * Loads data for a screen and reloads it on demand. A newer load always wins over an older one that finishes later.
 * 为页面加载数据，并支持按需重新加载。较新的加载总是优先于稍后才完成的较旧加载。
 */
export function useLoad<T>(load: () => Promise<T>, deps: readonly unknown[]): { state: LoadState<T>; reload: () => void } {
  const [state, setState] = useState<LoadState<T>>(LOADING);
  const [loadedFor, setLoadedFor] = useState(deps);
  const generation = useRef(0);
  const loader = useRef(load);
  loader.current = load;

  const run = useCallback(() => {
    generation.current += 1;
    const mine = generation.current;
    setState((previous) => (previous.status === 'ready' ? previous : LOADING));
    loader
      .current()
      .then((data) => {
        if (generation.current === mine) setState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (generation.current === mine) setState({ status: 'error', error });
      });
  }, []);

  useEffect(() => {
    setLoadedFor(deps);
    setState(LOADING);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { state: currentLoadState(state, loadedFor, deps), reload: run };
}
