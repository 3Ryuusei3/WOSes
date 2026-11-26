import { useState } from 'react';

export default function useInputResponse(possibleWords: string[], inputWord: string, correctWords: string[], handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void) {
  const [animateError, setAnimateError] = useState(false);
  const [animateSuccess, setAnimateSuccess] = useState(false);
  const [animateRepeated, setAnimateRepeated] = useState(false);
  const triggerAnimateErrpr = () => {
    setAnimateError(true);
    setTimeout(() => setAnimateError(false), 500);
  };

  const triggerAnimateSuccess = () => {
    setAnimateSuccess(true);
    // The hit sound is played by the word list when the word turns found
    // (it used to sound twice, once from here)
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
