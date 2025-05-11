import { useState, useRef, useEffect } from 'react';

import hitMusic from '../assets/hit.mp3';

export default function useInputResponse(possibleWords: string[], inputWord: string, correctWords: string[], handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void, volume: number) {
  const [animateError, setAnimateError] = useState(false);
  const [animateSuccess, setAnimateSuccess] = useState(false);
  const [animateRepeated, setAnimateRepeated] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(hitMusic);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playHitAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    return audioRef.current;
  };

  const triggerAnimateErrpr = () => {
    setAnimateError(true);
    setTimeout(() => setAnimateError(false), 500);
  };

  const triggerAnimateSuccess = () => {
    setAnimateSuccess(true);
    playHitAudio();
    setTimeout(() => {
      setAnimateSuccess(false);
    }, 500);
  };

  const triggerAnimateRepeated = () => {
    setAnimateRepeated(true);
    setTimeout(() => setAnimateRepeated(false), 500);
  };

  const handleKeyDownWithShake = (event: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(event);
    if (event.key === 'Enter') {
      if (!possibleWords.includes(inputWord)) {
        triggerAnimateErrpr();
      } else if (correctWords.includes(inputWord)) {
        triggerAnimateRepeated();
      } else {
        triggerAnimateSuccess();
      }
    }
  };

  return { animateError, animateSuccess, animateRepeated, triggerAnimateErrpr, triggerAnimateSuccess, triggerAnimateRepeated, handleKeyDownWithShake };
}
