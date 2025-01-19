import { useRef, useEffect, useState } from 'react';

import ScoreContainer from '../atoms/ScoreContainer';
import WarningMessage from '../atoms/WarningMessage';
import GameInput from '../atoms/GameInput';

import useShuffledWord from './../hooks/useShuffledWord';
import useInputWords from './../hooks/useInputWords';
import useProgressBar from './../hooks/useProgressBar';
import useCalculatePoints from './../hooks/useCalculatePoints';
import useInputResponse from './../hooks/useInputResponse';

import useGameStore from '../store/useGameStore';

import ShuffledWordObjectType from '../types/ShuffledWordObject';
import {
  THRESHHOLD,
  LEVELS_TO_ADVANCE,
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHUFFLE_INTERVAL,
  POINTS_PER_LETTER,
  FAKE_LETTER_LEVEL_START,
  HIDDEN_LETTER_LEVEL_START,
  HIDDEN_WORDS_LEVEL_START,
} from '../constant';

import goalSound from '../assets/goal.mp3';

export default function GameScreen() {
  const [hasPlayedGoalSound, setHasPlayedGoalSound] = useState(false);
  const [guessedWords, setGuessedWords] = useState<string[]>([]);
  const {
    player,
    setMode,
    gameTime,
    randomWord,
    possibleWords,
    setTotalPoints,
    setLastRoundPoints,
    level,
    setLevel,
    setLevelsToAdvance,
    setLastLevelWords
  } = useGameStore();
  const { percentage, timeLeft } = useProgressBar(gameTime);
  const shuffledWordObject = useShuffledWord(randomWord, SHUFFLE_INTERVAL, percentage > 0);
  const { inputWord, inputtedWords, correctWords, handleChange, handleKeyDown } = useInputWords(possibleWords);
  const { correctWordsPoints, goalPoints, totalPoints } = useCalculatePoints(possibleWords, correctWords);
  const { animateError, animateSuccess, animateRepeated, handleKeyDownWithShake } = useInputResponse(possibleWords, inputWord, correctWords, handleKeyDown, guessedWords, setGuessedWords);
  const wordRefs = useRef<(HTMLLIElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateLastLevelWordsAndPoints = () => {
    setTotalPoints(prev => prev + correctWordsPoints());
    setLastLevelWords(possibleWords.map(word => ({
      word,
      guessed: correctWords.includes(word)
    })));
  };

  const handleEndOfLevel = () => {
    if (correctWordsPoints() >= goalPoints || (totalPoints > 0 && totalPoints === correctWordsPoints() && correctWords.length === possibleWords.length)) {
      let levelsAdded = 0;
      const completionPercentage = (correctWordsPoints() / totalPoints) * 100;

      if (completionPercentage >= THRESHHOLD.THREE_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.THREE_STAR;
      } else if (completionPercentage >= THRESHHOLD.TWO_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.TWO_STAR;
      } else if (completionPercentage >= THRESHHOLD.ONE_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.ONE_STAR;
      }
      setLevelsToAdvance(levelsAdded);
      setLevel((prev: number) => prev + levelsAdded);
      setLastRoundPoints(correctWordsPoints());
      updateLastLevelWordsAndPoints();
      setMode('lobby');
    } else {
      updateLastLevelWordsAndPoints();
      setMode('lost');
    }
  };

  useEffect(() => {
    if (percentage === 0 ||
      totalPoints > 0 && correctWords.length === possibleWords.length) {
      handleEndOfLevel();
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }

    if (totalPoints > 0 && correctWordsPoints() >= goalPoints && !hasPlayedGoalSound) {
      const audio = new Audio(goalSound);
      audio.play();
      setHasPlayedGoalSound(true);
    }
  }, [percentage, totalPoints, correctWordsPoints, goalPoints, hasPlayedGoalSound]);

  return (
    <>
      {(player && player.role === 'screen') ? (
      <>
        <ScoreContainer
          correctWords={correctWords}
          possibleWords={possibleWords}
          correctWordsPoints={correctWordsPoints}
          goalPoints={goalPoints}
          level={level}
        />
        <div className='game__container'>
          <div className="h-section gap-xs">
            <div className="h-section gap-sm">
              <WarningMessage
                level={level}
                HIDDEN_LETTER_LEVEL_START={HIDDEN_LETTER_LEVEL_START}
                FAKE_LETTER_LEVEL_START={FAKE_LETTER_LEVEL_START}
                HIDDEN_WORDS_LEVEL_START={HIDDEN_WORDS_LEVEL_START}
              />
              <div key={shuffledWordObject.map((letter: ShuffledWordObjectType) => letter.letter).join('')} className="selectedWord">
                {shuffledWordObject.map((letter: ShuffledWordObjectType, index: number) => (
                  <span
                    key={`${index}-${letter.letter}`}
                    className={`selectedLetter${letter.isFake && percentage < RUNNING_OUT_OF_TIME_PERCENTAGE ? ' fake' : ''}${letter.isHidden && level >= HIDDEN_LETTER_LEVEL_START ? ' hidden' : ''}`}
                  >
                    {letter.isHidden && level >= HIDDEN_LETTER_LEVEL_START && percentage > RUNNING_OUT_OF_TIME_PERCENTAGE ? '?' : letter.letter}
                    <span className='letterPoints'>{POINTS_PER_LETTER[letter.letter as keyof typeof POINTS_PER_LETTER]}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="h-section">
              <div className="progress__time">{Math.floor(timeLeft / 1000)}s</div>
              <div
                className="progress__container"
                style={{
                '--remaining-percentage': `${percentage}%`,
                '--clr-progress-color': percentage < RUNNING_OUT_OF_TIME_PERCENTAGE ? 'var(--clr-progress-late)' : 'var(--clr-progress-on-time)'
                } as React.CSSProperties}
              >
              </div>
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
                  <span className='player'>{player.name}</span>
                )}
                <span className='wordLetters'>
                  {word.split('').map((letter, letterIndex) => (
                    <span key={`${index}-${word}-${letter}-${letterIndex}`} className='letter'>
                      <span>
                        {(level >= HIDDEN_WORDS_LEVEL_START && percentage > RUNNING_OUT_OF_TIME_PERCENTAGE && letterIndex >= 1) ? '?' : letter}
                      </span>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </>
      ) : (
        <GameInput
          guessedWords={guessedWords}
          inputtedWords={inputtedWords}
          inputWord={inputWord}
          handleChange={handleChange}
          handleKeyDownWithShake={handleKeyDownWithShake}
          animateError={animateError}
          animateSuccess={animateSuccess}
          animateRepeated={animateRepeated}
          percentage={percentage}
        />
      )}
    </>
  )
}
