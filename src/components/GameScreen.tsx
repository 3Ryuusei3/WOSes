import { useRef, useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';

import useRandomWords from './../hooks/useRandomWords';
import useShuffledWord from './../hooks/useShuffledWord';
import useInputWords from './../hooks/useInputWords';
import useProgressBar from './../hooks/useProgressBar';
import useCalculatePoints from './../hooks/useCalculatePoints';
import useTruncatePlayerName from './../hooks/useTruncatePlayerName';
import useInputResponse from './../hooks/useInputResponse';

import useGameStore from '../store/useGameStore';

import { THRESHHOLD, LEVELS_TO_ADVANCE, RUNNING_OUT_OF_TIME } from '../contant';

import points from './../points.json';

export default function GameScreen() {
  const {
    playerName,
    setMode,
    gameTime,
    setTotalPoints,
    setLastRoundPoints,
    level,
    setLevel,
    setLevelsToAdvance
  } = useGameStore();
  const { randomWord, possibleWords } = useRandomWords();
  const { percentage, timeLeft } = useProgressBar(gameTime);
  const shuffledWord = useShuffledWord(randomWord, 8000, percentage > 0);
  const { inputWord, inputtedWords, correctWords, handleChange, handleKeyDown } = useInputWords(possibleWords);
  const { correctWordsPoints, goalPoints, totalPoints } = useCalculatePoints(possibleWords, correctWords);
  const { animateError, animateSuccess, handleKeyDownWithShake } = useInputResponse(possibleWords, inputWord, handleKeyDown);
  const wordRefs = useRef<(HTMLLIElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log(correctWordsPoints())
    if (percentage === 0 && correctWordsPoints() >= goalPoints
      || (totalPoints > 0 && totalPoints === correctWordsPoints() && correctWords.length === possibleWords.length)) {
      let levelsAdded = 0;
      const completionPercentage = (correctWordsPoints() / totalPoints) * 100;

      if (completionPercentage >= THRESHHOLD.THREE_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.THREE_STAR;
      } else if (completionPercentage >= THRESHHOLD.TWO_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.TWO_STAR;
      } else if (completionPercentage >= THRESHHOLD.ONE_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.ONE_STAR;
      }
      console.log(possibleWords);
      setLevelsToAdvance(levelsAdded);
      setTotalPoints(prev => prev + correctWordsPoints());
      setLevel((prev: number) => prev + levelsAdded);
      setLastRoundPoints(correctWordsPoints());
      setMode('lobby');
    }
    if (percentage === 0 && correctWordsPoints() < goalPoints) {
      console.log(possibleWords);
      setTotalPoints(prev => prev + correctWordsPoints());
      setMode('lost');
    }
  }, [percentage, correctWordsPoints, goalPoints, setMode, setTotalPoints, setLastRoundPoints]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <div className='score__container'>
        <div className={`score__container--box ${correctWords.length === possibleWords.length ? 'won' : ''}`}>
          <p>PALABRAS</p>
          <h3>{correctWords.length}/{possibleWords.length}</h3>
        </div>
        <GameLogo />
        <div className={`score__container--box ${correctWordsPoints() >= goalPoints ? 'won' : ''}`}>
          <div className="v-section gap-md">
            <div className="h-section">
              <p>OBJETIVO</p>
              <h3>{correctWordsPoints()}/{goalPoints}</h3>
            </div>
            <div className="h-section">
              <p>NIVEL</p>
              <h3>{level}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className='game__container'>
        <div className="selectedWord">
          {shuffledWord.split('').map((letter, index) => (
            <span key={`${index}-${letter}`} className='selectedLetter'>
              {letter}
              <span className='letterPoints'>{points[letter as keyof typeof points]}</span>
            </span>
          ))}
        </div>
        <div className="h-section">
          <div className="progress__time">{Math.floor(timeLeft / 1000)}s</div>
          <div
            className="progress__container"
            style={{
            '--remaining-percentage': `${percentage}%`,
            '--clr-progress-color': percentage < RUNNING_OUT_OF_TIME ? 'var(--clr-progress-late)' : 'var(--clr-progress-on-time)'
            } as React.CSSProperties}
          >
          </div>
        </div>
        <ul className='wordlist' style={{ '--wordlist-rows': Math.ceil(possibleWords.length / 3) } as React.CSSProperties}>
          {possibleWords.map((word, index) => (
            <li
              key={`${index}-${word}`}
              className={`word ${inputtedWords.includes(word) ? 'active' : ''}`}
              ref={el => wordRefs.current[index] = el}
            >
              {inputtedWords.includes(word) && (
                <span className='playerName'>{useTruncatePlayerName(playerName, word.length)}</span>
              )}
              <span className='wordLetters'>
                {word.split('').map((letter, letterIndex) => (
                  <span key={`${index}-${word}-${letter}-${letterIndex}`} className='letter'>
                    <span>{letter}</span>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <input
          type="text"
          className={`mx-auto mt-auto ${animateError ? 'animate-error' : ''} ${animateSuccess ? 'animate-success' : ''}`}
          placeholder='INTRODUCE LA PALABRA...'
          value={inputWord}
          onChange={handleChange}
          onKeyDown={handleKeyDownWithShake}
          disabled={percentage === 0}
          ref={inputRef}
        />
      </div>
    </>
  )
}
