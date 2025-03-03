import ShuffledWordObjectType from '../types/ShuffledWordObject';
import Difficulty from '../types/Difficulty';
import { POINTS_PER_LETTER } from '../constant';

interface SelectedWordProps {
  shuffledWordObject: ShuffledWordObjectType[];
  percentage: number;
  gameDifficulty: Difficulty
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function SelectedWord({
  shuffledWordObject,
  percentage,
  gameDifficulty,
  SHOW_LETTERS_PERCENTAGE,
}: SelectedWordProps) {
  return (
    <div
      key={shuffledWordObject.map(letter => letter.letter).join('')}
      className="selectedWord"
    >
      {shuffledWordObject.map((letter, index) => (
        <span
          key={`${index}-${letter.letter}`}
          className={`selectedLetter${
            letter.isFake && percentage < SHOW_LETTERS_PERCENTAGE ? ' fake' : ''
          }${
            letter.isHidden && gameDifficulty.hidden ? ' hidden' : ''
          }`}
        >
          {letter.isHidden && gameDifficulty.hidden && percentage > SHOW_LETTERS_PERCENTAGE
            ? '?'
            : letter.letter
          }
          <span className='letterPoints'>
            {POINTS_PER_LETTER[letter.letter as keyof typeof POINTS_PER_LETTER]}
          </span>
        </span>
      ))}
    </div>
  );
}
