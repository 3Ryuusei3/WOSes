import useRandomWords from './../hooks/useRandomWords';
import useShuffledWord from './../hooks/useShuffledWord';
import useInputWords from './../hooks/useInputWords';
import useProgressBar from './../hooks/useProgressBar';
import useCalculatePoints from './../hooks/useCalculatePoints';

import logo from './../assets/logo.png';
import points from './../points.json';
import { useEffect } from 'react';

interface GameScreenProps {
  playerName: string;
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost">>;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  setLastRoundPoints: React.Dispatch<React.SetStateAction<number>>;
}

export default function GameScreen({ playerName, setMode, setTotalPoints, setLastRoundPoints }: GameScreenProps) {
  const { randomWord, possibleWords } = useRandomWords();
  const { percentage } = useProgressBar(30);
  const shuffledWord = useShuffledWord(randomWord, 8000, percentage > 0);
  const { inputWord, inputtedWords, correctWords, handleChange, handleKeyDown } = useInputWords(possibleWords);
  const { correctWordsPoints, goalPoints } = useCalculatePoints(possibleWords, correctWords);

  useEffect(() => {
    if (percentage === 0 && correctWordsPoints() >= goalPoints) {
      setTotalPoints(prev => prev + correctWordsPoints());
      setLastRoundPoints(correctWordsPoints());
      setMode('lobby');
    }
    if (percentage === 0 && correctWordsPoints() < goalPoints) {
      setTotalPoints(prev => prev + correctWordsPoints());
      setMode('lost');
    }
  }, [percentage, correctWordsPoints, goalPoints, setMode, setTotalPoints, setLastRoundPoints]);

  return (
    <>
      <div className='score__container'>
        <div className={`score__container--box ${correctWords.length === possibleWords.length ? 'highlight' : ''}`}>
          <p>PALABRAS</p>
          <h3>{correctWords.length} / {possibleWords.length}</h3>
        </div>
        <img src={logo} alt='logo' width={170} />
        <div className={`score__container--box ${correctWordsPoints() >= goalPoints ? 'highlight' : ''}`}>
          <p>OBJETIVO</p>
          <h3>{correctWordsPoints()} / {goalPoints}</h3>
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
        <div className="progress" style={{ '--remaining-percentage': `${percentage}%` } as React.CSSProperties}></div>
        <ul className='wordlist'>
          {possibleWords.map((word, index) => (
            <li
              key={`${index}-${word}`}
              className={`word ${inputtedWords.includes(word) ? 'active' : ''}`}
            >
              {inputtedWords.includes(word) && (
                <span className='playerName'>{playerName.substring(0, 6)}</span>
              )}
              <span className='wordLetters'>
                {word.split('').map((letter, letterIndex) => (
                  <span key={`${index}-${word}-${letter}-${letterIndex}`} className='letter'>
                    {letter}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <input
          type="text"
          className='mx-auto'
          value={inputWord}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={correctWords.length === possibleWords.length || percentage === 0}
        />
      </div>
    </>
  )
}
