import React, { useEffect, useRef } from 'react';

interface GameInputProps {
  guessedWords: string[];
  inputtedWords: string[];
  inputWord: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDownWithShake: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  animateError: boolean;
  animateSuccess: boolean;
  animateRepeated: boolean;
  percentage: number;
}

export default function GameInput({
  guessedWords,
  inputtedWords,
  inputWord,
  handleChange,
  handleKeyDownWithShake,
  animateError,
  animateSuccess,
  animateRepeated,
  percentage,
}: GameInputProps) {
  const gameInputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gameInputRef.current) {
      gameInputRef.current.scrollTop = gameInputRef.current.scrollHeight;
    }
  }, [guessedWords]);

  return (
    <div className='game-input__container'>
      <div className='wordlist' ref={gameInputRef}>
        {guessedWords.map((word, index) => (
          <li key={`${word}-${index}`} className={`word ${inputtedWords.includes(word) ? 'active' : ''}`}>
            <span className='wordLetters'>
              {word.split('').map((letter, letterIndex) => (
                <span key={`${index}-${word}-${letter}-${letterIndex}`} className='letter'>
                  <span>{letter}</span>
                </span>
              ))}
            </span>
          </li>
        ))}
      </div>
      <div className='h-section w100'>
        <input
          type="text"
          className={`mx-auto mt-auto ${animateError ? 'animate-error' : ''} ${animateSuccess ? 'animate-success' : ''} ${animateRepeated ? 'animate-repeated' : ''}`}
          placeholder='INTRODUCE LA PALABRA...'
          value={inputWord}
          onChange={handleChange}
          onKeyDown={handleKeyDownWithShake}
          disabled={percentage === 0}
          ref={inputRef}
        />
      </div>
    </div>
  );
};
