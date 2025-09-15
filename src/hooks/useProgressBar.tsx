import { useState, useEffect, useRef } from 'react';

const useProgressBar = (duration: number, startedAtMs?: number) => {
  const durationMsRef = useRef<number>(duration * 1000);
  const startedAtRef = useRef<number>(startedAtMs ?? Date.now());
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    durationMsRef.current = duration * 1000;
  }, [duration]);

  useEffect(() => {
    if (startedAtMs) {
      startedAtRef.current = startedAtMs;
    } else {
      startedAtRef.current = Date.now();
    }
  }, [startedAtMs, duration]);

  useEffect(() => {
    let rafId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => setNow(Date.now());

    intervalId = setInterval(tick, 200);

    const loop = () => {
      tick();
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const endAt = startedAtRef.current + durationMsRef.current;
  const timeLeft = Math.max(0, endAt - now);
  const percentage = Math.max(0, Math.min(100, (timeLeft / durationMsRef.current) * 100 || 0));

  return { timeLeft, percentage };
};

export default useProgressBar;
