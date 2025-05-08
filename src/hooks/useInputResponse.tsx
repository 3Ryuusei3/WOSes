import { useState } from 'react';

import hitMusic from '../assets/hit.mp3';

export default function useInputResponse(possibleWords: string[], inputWord: string, correctWords: string[], handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void, volume: number) {
  const [animateError, setAnimateError] = useState(false);
  const [animateSuccess, setAnimateSuccess] = useState(false);
  const [animateRepeated, setAnimateRepeated] = useState(false);

  const playHitAudio = () => {
    const audio = new Audio(hitMusic);
    audio.volume = volume;
    audio.play();
    return audio;
  };

  const triggerAnimateErrpr = () => {
    setAnimateError(true);
    setTimeout(() => setAnimateError(false), 500);
  };

  const triggerAnimateSuccess = () => {
    setAnimateSuccess(true);
    const audio = playHitAudio();
    audio.volume = volume;
    setTimeout(() => {
      setAnimateSuccess(false);
      audio.pause();
      audio.currentTime = 0;
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
