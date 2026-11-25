import { useState, useEffect, useRef } from 'react';

/**
 * Round clock.
 *
 * It does NOT re-render every frame: the bar is animated by CSS (see
 * ProgressBar), so React only needs to wake up when something it shows or
 * reacts to changes — each whole second (the "Ns" label) and the moment the
 * remaining percentage crosses one of `checkpoints` (colour changes, letter
 * reveal). That keeps GameScreen at ~1 render/s instead of ~60.
 */
const useProgressBar = (
  duration: number,
  startedAtMs?: number,
  checkpoints: number[] = [],
) => {
  const durationMs = duration * 1000;
  const startedAtRef = useRef<number>(startedAtMs ?? Date.now());
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    startedAtRef.current = startedAtMs ?? Date.now();
    setNow(Date.now());
  }, [startedAtMs, duration]);

  const checkpointsKey = checkpoints.join(',');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      const current = Date.now();
      setNow(current);

      const endAt = startedAtRef.current + durationMs;
      const left = endAt - current;
      if (left <= 0) return;

      // Next whole second of the remaining time (when the label changes)
      let wait = left % 1000 || 1000;
      // ...or sooner if a percentage checkpoint is crossed first
      for (const pct of checkpoints) {
        const at = (pct / 100) * durationMs; // remaining ms at that checkpoint
        if (at < left) wait = Math.min(wait, left - at);
      }
      // A few ms late so the computed value is already past the boundary
      timeoutId = setTimeout(schedule, wait + 5);
    };

    schedule();

    // Background tabs throttle timers: resync when coming back
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (timeoutId) clearTimeout(timeoutId);
      schedule();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAtMs, durationMs, checkpointsKey]);

  const startedAt = startedAtRef.current;
  const timeLeft = Math.max(0, startedAt + durationMs - now);
  const percentage = Math.max(0, Math.min(100, (timeLeft / durationMs) * 100 || 0));

  return { timeLeft, percentage, startedAt, durationMs };
};

export default useProgressBar;
