import { useRef } from 'react';
import Word from '../types/Word';

interface WordListProps {
  words: Word[];
  playerName: string;
  level: number;
  percentage: number;
  HIDDEN_WORDS_LEVEL_START: number;
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function WordList({ words, playerName, level, percentage, HIDDEN_WORDS_LEVEL_START, SHOW_LETTERS_PERCENTAGE }: WordListProps) {
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
                  {(level >= HIDDEN_WORDS_LEVEL_START && percentage > SHOW_LETTERS_PERCENTAGE && letterIndex >= 1) ? '?' : letter}
                </span>
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
