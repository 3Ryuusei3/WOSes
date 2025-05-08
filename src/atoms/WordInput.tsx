import { useRef, useEffect } from 'react';

import useInputResponse from '../hooks/useInputResponse';

interface WordInputProps {
  inputWord: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  possibleWords: string[];
  correctWords: string[];
  percentage: number;
  volume: number;
}

export default function WordInput({
  inputWord,
  handleChange,
  handleKeyDown,
  possibleWords,
  correctWords,
  percentage,
  volume
}: WordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { animateError, animateSuccess, animateRepeated, handleKeyDownWithShake } =
    useInputResponse(possibleWords, inputWord, correctWords, handleKeyDown, volume);

  useEffect(() => {
    if (percentage > 0) {
      inputRef.current?.focus();
    }
  }, [percentage]);

  return (
    <input
      type="text"
      className={`mx-auto mt-auto ${animateError ? 'animate-error' : ''} ${animateSuccess ? 'animate-success' : ''} ${animateRepeated ? 'animate-repeated' : ''}`}
      placeholder='INTRODUCE LA PALABRA...'
      value={inputWord}
      onChange={handleChange}
      onKeyDown={handleKeyDownWithShake}
      disabled={percentage === 0}
      ref={inputRef}
      autoFocus
    />
  );
}
