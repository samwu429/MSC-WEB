import { useCallback, useEffect, useState } from 'react';

const FLASH_DURATION_MS = 4000;

/**
 * A short success message that clears itself, so a confirmation never lingers beside later edits. Each call starts
 * a fresh timer, even when the same text is shown twice in a row.
 * 会自动消失的简短成功提示，确认信息因此不会一直停留在之后的编辑旁边。每次显示都会重新计时，即使连续两次显示相同的文字。
 */
export function useFlash(initial: string | null = null): { flash: string | null; showFlash: (message: string) => void; clearFlash: () => void } {
  const [current, setCurrent] = useState<{ message: string } | null>(initial ? { message: initial } : null);

  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(() => setCurrent(null), FLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [current]);

  const showFlash = useCallback((message: string) => setCurrent({ message }), []);
  const clearFlash = useCallback(() => setCurrent(null), []);
  return { flash: current?.message ?? null, showFlash, clearFlash };
}
