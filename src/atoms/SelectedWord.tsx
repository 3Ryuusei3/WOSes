import ShuffledWordObjectType from '../types/ShuffledWordObject';
import { POINTS_PER_LETTER } from '../constant';

interface SelectedWordProps {
  shuffledWordObject: ShuffledWordObjectType[];
  level: number;
  percentage: number;
  SHOW_LETTERS_PERCENTAGE: number;
  HIDDEN_LETTER_LEVEL_START: number;
}

export default function SelectedWord({
  shuffledWordObject,
  level,
  percentage,
  SHOW_LETTERS_PERCENTAGE,
  HIDDEN_LETTER_LEVEL_START
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
            letter.isHidden && level >= HIDDEN_LETTER_LEVEL_START ? ' hidden' : ''
          }`}
        >
          {letter.isHidden && level >= HIDDEN_LETTER_LEVEL_START && percentage > SHOW_LETTERS_PERCENTAGE
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
