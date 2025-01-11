import { useState } from 'react';

export default function useInputResponse(possibleWords: string[], inputWord: string, handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void) {
  const [animateError, setAnimateError] = useState(false);
  const [animateSuccess, setAnimateSuccess] = useState(false);

  const triggerShake = () => {
    setAnimateError(true);
    setTimeout(() => setAnimateError(false), 500);
  };

  const triggerAnimateSuccess = () => {
    setAnimateSuccess(true);
    setTimeout(() => setAnimateSuccess(false), 500);
  };

  const handleKeyDownWithShake = (event: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(event);
    if (event.key === 'Enter') {
      if (!possibleWords.includes(inputWord)) {
        triggerShake();
      } else {
        triggerAnimateSuccess();
      }
    }
  };

  return { animateError, animateSuccess, triggerShake, triggerAnimateSuccess, handleKeyDownWithShake };
}
