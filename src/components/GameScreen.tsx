import { useRef, useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';

import useRandomWords from './../hooks/useRandomWords';
import useShuffledWord from './../hooks/useShuffledWord';
import useInputWords from './../hooks/useInputWords';
import useProgressBar from './../hooks/useProgressBar';
import useCalculatePoints from './../hooks/useCalculatePoints';
import useTruncatePlayerName from './../hooks/useTruncatePlayerName';
import useInputResponse from './../hooks/useInputResponse';

import points from './../points.json';

interface GameScreenProps {
  playerName: string;
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost" | "loading">>;
  gameTime: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  setLastRoundPoints: React.Dispatch<React.SetStateAction<number>>;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  setLevelsToAdvance: React.Dispatch<React.SetStateAction<number>>;
}

export default function GameScreen({
  playerName,
  setMode,
  gameTime,
  setTotalPoints,
  setLastRoundPoints,
  level,
  setLevel,
  setLevelsToAdvance
}: GameScreenProps) {
  const { randomWord, possibleWords } = useRandomWords();
  const { percentage, timeLeft } = useProgressBar(gameTime);
  const shuffledWord = useShuffledWord(randomWord, 8000, percentage > 0);
  const { inputWord, inputtedWords, correctWords, handleChange, handleKeyDown } = useInputWords(possibleWords);
  const { correctWordsPoints, goalPoints, totalPoints } = useCalculatePoints(possibleWords, correctWords);
  const { animateError, animateSuccess, handleKeyDownWithShake } = useInputResponse(possibleWords, inputWord, handleKeyDown);
  const wordRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {

    if (percentage === 0 && correctWordsPoints() >= goalPoints
      || (totalPoints > 0 && totalPoints === correctWordsPoints() && correctWords.length === possibleWords.length)) {
      let levelsAdded = 0;
      const completionPercentage = (correctWordsPoints() / totalPoints) * 100;

      if (completionPercentage >= 90) {
        levelsAdded = 3;
      } else if (completionPercentage >= 70) {
        levelsAdded = 2;
      } else if (completionPercentage >= 40) {
        levelsAdded = 1;
      }
      console.log(possibleWords);
      setLevelsToAdvance(levelsAdded);
      setTotalPoints(prev => prev + correctWordsPoints());
      setLevel(prev => prev + levelsAdded);
      setLastRoundPoints(correctWordsPoints());
      setMode('lobby');
    }
    if (percentage === 0 && correctWordsPoints() < goalPoints) {
      console.log(possibleWords);
      setTotalPoints(prev => prev + correctWordsPoints());
      setMode('lost');
    }
  }, [percentage, correctWordsPoints, goalPoints, setMode, setTotalPoints, setLastRoundPoints]);

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
            '--clr-progress-color': percentage < 10 ? 'var(--clr-progress-late)' : 'var(--clr-progress-on-time)'
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
        />
      </div>
    </>
  )
}
