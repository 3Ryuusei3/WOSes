import { useEffect, useRef, useState } from 'react';
import useGameStore from '../store/useGameStore';
import { COUNTDOWN } from '../constant';

const useCountdown = (durationSec: number = COUNTDOWN, startedAtMs?: number) => {
  const { setMode, roomCode } = useGameStore();
  const startedAtRef = useRef<number>(startedAtMs ?? Date.now());
  const durationMsRef = useRef<number>(durationSec * 1000);
  const [now, setNow] = useState<number>(Date.now());
  const finishedRef = useRef<boolean>(false);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    durationMsRef.current = durationSec * 1000;
  }, [durationSec]);

  useEffect(() => {
    if (startedAtMs) startedAtRef.current = startedAtMs;
    else startedAtRef.current = Date.now();
  }, [startedAtMs, durationSec]);

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
  const msLeft = Math.max(0, endAt - now);
  const secondsLeft = msLeft / 1000;

  useEffect(() => {
    if (secondsLeft <= 0 && !roomCode && !finishedRef.current) {
      finishedRef.current = true;
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = setTimeout(() => {
        setMode('game');
      }, 450);
    }
    return () => {
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
    };
  }, [secondsLeft, roomCode, setMode]);

  return secondsLeft;
};

export default useCountdown;
