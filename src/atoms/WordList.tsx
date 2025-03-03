import { useRef } from 'react';

import Word from '../types/Word';
import Difficulty from '../types/Difficulty';

interface WordListProps {
  words: Word[];
  playerName: string;
  percentage: number;
  gameDifficulty: Difficulty;
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function WordList({ words, playerName, percentage, gameDifficulty, SHOW_LETTERS_PERCENTAGE }: WordListProps) {
  const wordRefs = useRef<(HTMLLIElement | null)[]>([]);

  return (
    <ul className='wordlist' style={{ '--wordlist-rows': Math.ceil(words.length / 3) } as React.CSSProperties}>
      {words.map((wordObj, index) => (
        <li
          key={`${index}-${wordObj.word}`}
          className={`word ${wordObj.guessed ? 'active' : ''}`}
          ref={el => wordRefs.current[index] = el}
        >
          {wordObj.guessed && (
            <span className='playerName'>{playerName}</span>
          )}
          <span className='wordLetters'>
            {wordObj.word.split('').map((letter, letterIndex) => (
              <span key={`${index}-${wordObj.word}-${letter}-${letterIndex}`} className='letter'>
                <span>
                  {(gameDifficulty.hiddenWords && percentage > SHOW_LETTERS_PERCENTAGE && letterIndex >= 1) ? '?' : letter}
                </span>
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
