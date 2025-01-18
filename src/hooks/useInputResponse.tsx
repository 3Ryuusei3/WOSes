import { useState } from 'react';

import hitMusic from '../assets/hit.mp3';

export default function useInputResponse(possibleWords: string[], inputWord: string, correctWords: string[], handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void, setGuessedWords: (guessedWords: string[]) => void) {
  const [animateError, setAnimateError] = useState(false);
  const [animateSuccess, setAnimateSuccess] = useState(false);
  const [animateRepeated, setAnimateRepeated] = useState(false);

  const playHitAudio = () => {
    const audio = new Audio(hitMusic);
    audio.volume = 0.5;
    audio.play();
    return audio;
  };

  const triggerAnimateError = () => {
    setAnimateError(true);
    setTimeout(() => setAnimateError(false), 500);
  };

  const triggerAnimateSuccess = () => {
    setAnimateSuccess(true);
    const audio = playHitAudio();
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
        triggerAnimateError();
      } else if (correctWords.includes(inputWord)) {
        triggerAnimateRepeated();
      } else {
        triggerAnimateSuccess();
      }
    }
    setGuessedWords([...correctWords, inputWord]);
  };

  return { animateError, animateSuccess, animateRepeated, triggerAnimateError, triggerAnimateSuccess, triggerAnimateRepeated, handleKeyDownWithShake };
}
